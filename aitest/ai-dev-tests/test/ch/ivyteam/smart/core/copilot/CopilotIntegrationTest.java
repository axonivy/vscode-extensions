package ch.ivyteam.smart.core.copilot;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;

import ch.ivyteam.smart.core.AgentRuntime;
import ch.ivyteam.smart.core.AgentRuntimeExtension;
import ch.ivyteam.smart.core.aspire.AspireSpans.UsedTool;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@ExtendWith(AgentRuntimeExtension.class)
public class CopilotIntegrationTest {

  @Test
  @Order(3)
  void createProject(AgentRuntime rt) throws Exception {
    var spans = rt.prompt("create a new Axon Ivy project called flight-simulator");
    var tokenUsage = spans.tokenUsage();
    assertThat(tokenUsage.input()).isLessThan(150_000);
    assertThat(tokenUsage.output()).isLessThan(10_000);

    var flightSimulator = rt.ivyWorkspace().path().resolve("flight-simulator");
    assertThat(flightSimulator)
        .as("project created in workspace")
        .exists();
    assertThat(rt.ivyEngine().newLogs())
        .as("no-errors in log")
        .isEmpty();
    assertThat(spans.usedTools())
        .as("new_axon_ivy_project tool was used")
        .extracting(UsedTool::name)
        .contains("axonivy-designer-new_axon_ivy_project");
  }

  @Test
  @Order(2)
  void mcpON(AgentRuntime rt) throws Exception {
    assertThat(rt.copilot().listMcp())
        .as("MCP is configured for Copilot user")
        .contains(
            "\"type\": \"http\"",
            "\"url\": \"http://designer-mcp:32140/mcp\"");
    assertThat(rt.copilot().mcpHealth())
        .as("MCP answers health with 200 OK")
        .isEqualTo(200);

    var spans = rt.prompt("name all available tools from current MCP setup");

    assertThat(spans.tools().names())
        .as("tools from vscode-designer MCP are propagated to harness")
        .contains("axonivy-designer-new_axon_ivy_project");

    var tokenUsage = spans.tokenUsage();
    assertThat(tokenUsage.input()).isLessThan(150_000);
    assertThat(tokenUsage.output()).isLessThan(10_000);
  }

  @Test
  @Order(1) // before: createProject (let's fetch the schemas here for the first time)
  void initEditRolesYaml(AgentRuntime rt) throws Exception {
    var spans = rt.prompt("create the roles: manager and employee in purchase/config/roles.yaml");

    var roles = rt.ivyWorkspace().path().resolve("purchase/config/roles.yaml");
    assertThat(roles).content()
        .as("Id: field name is known by reading roles.yaml schema")
        .containsIgnoringCase("Id: manager")
        .containsIgnoringCase("Id: employee");
    assertThat(roles).content()
        .as("no tabs in roles.yaml: happens in vscode copilot quite often")
        .doesNotContain("\t");

    assertThat(spans.usedTools())
        .extracting(UsedTool::name)
        .contains("skill")
        .doesNotContain("web_fetch"); // skill cache!

    var skillTool = spans.usedTools().stream().filter(t -> t.name().equals("skill")).findFirst().orElseThrow();
    assertThat(skillTool.arguments()).contains("ivy-yaml-files");

    var viewSchema = spans.usedTools().stream()
        .filter(t -> t.name().equals("view"))
        .filter(t -> t.arguments().contains("skills/ivy-yaml-files/schemas/"))
        .findFirst().orElseThrow();
    assertThat(viewSchema.arguments())
        .as("schema read was enforced by skill")
        .contains("config/roles.json");

    var tokenUsage = spans.tokenUsage();
    assertThat(tokenUsage.input()).isLessThan(200_000); // around: 170_000 in local tests
    assertThat(tokenUsage.output()).isLessThan(10_000);
  }

  @Test
  @Order(1)
  void process(AgentRuntime rt) throws Exception {
    var spans = rt.prompt("""
        create a new process for 'treePlanting' in 'purchase' project.
        The start must accept a 'name' parameter.
        After the start, a Script activity should print a 'Hello Ivy in.name!' log.
        """);

    var purchase = rt.ivyWorkspace().path().resolve("purchase");
    var processDir = purchase.resolve("process");
    Path plantProcess;
    try (var stream = Files.walk(processDir)) {
      plantProcess = stream
          .filter(p -> p.getFileName().toString().equals("treePlanting.p.json"))
          .findFirst()
          .orElseThrow(() -> new AssertionError("Process treePlanting.p.json not found under " + processDir));
    }
    var procJson = readJson(plantProcess);
    assertThat(procJson.get("$schema").asString())
        .as("valid $schema was set by new_process_tool")
        .startsWith("https://json-schema.axonivy.com/");

    var dataClass = procJson.path("config").path("data").asString().replace('.', '/');
    var dataJson = readJson(purchase.resolve("dataclass/" + dataClass + ".d.json"));
    assertThat(dataJson.path("fields").valueStream().map(f -> f.path("name").asString()))
        .as("mapped attribute 'out.name' exists in data class: %s", dataJson.toPrettyString())
        .contains("name");

    var start = procElement(procJson, "RequestStart");
    var input = start.path("config").path("input");
    assertThat(input.path("params").valueStream().map(p -> p.path("name").asString()))
        .as("start declares the 'name' parameter: %s", start.toPrettyString())
        .contains("name");
    assertThat(input.path("map").path("out.name").asString())
        .as("start maps the parameter into process data: %s", start.toPrettyString())
        .isEqualTo("param.name");

    var script = procElement(procJson, "Script");
    assertThat(script.get("config").get("output").get("code").toPrettyString())
        .as("Script Activity is configured schema-aware")
        .contains("ivy.log.", "Hello Ivy", "in.name");

    assertThat(spans.usedTools())
        .extracting(UsedTool::name)
        .as("Must use create-tool for initial correct creation; then web_fetch to get aware of the schema")
        .contains("skill", "axonivy-designer-new_axon_ivy_process")
        .doesNotContain("web_fetch"); // skill cache!

    var viewSchema = spans.usedTools().stream()
        .filter(t -> t.name().equals("view"))
        .filter(t -> t.arguments().contains("skills/ivy-json-files/schemas/"))
        .findFirst().orElseThrow();
    assertThat(viewSchema.arguments())
        .as("schema read was enforced by skill")
        .contains("project/process.json");
  }

  @Test
  @Order(2)
  void formDialog(AgentRuntime rt) throws Exception {
    var spans = rt.prompt("""
        create a new dialog 'OrderForm' in 'purchase' project.
        The form lets the user enter an order: 'product' (text), 'quantity' (number) and 'deliveryDate' (date),
        each bound to the dialog data.
        """);

    var purchase = rt.ivyWorkspace().path().resolve("purchase");
    var form = findFile(purchase.resolve("dialog"), "OrderForm.f.json");
    assertThat(form.getParent().toFile().list())
        .as("Form dialog consists of form, data class and process")
        .containsExactlyInAnyOrder("OrderForm.f.json", "OrderFormData.d.json", "OrderFormProcess.p.json");

    assertOrderData(form.resolveSibling("OrderFormData.d.json"));

    var formJson = readJson(form);
    var bindings = formJson.path("components").findParents("type").stream()
        .collect(Collectors.toMap(c -> c.path("config").path("value").asString(), c -> c.path("type").asString(), (a, b) -> a));
    assertThat(bindings)
        .as("components are bound to the data attributes: %s", formJson.toPrettyString())
        .containsEntry("#{data.product}", "Input")
        .containsEntry("#{data.quantity}", "Input")
        .containsEntry("#{data.deliveryDate}", "DatePicker");

    assertThat(spans.usedTools())
        .extracting(UsedTool::name)
        .as("Must use create-tool for initial correct creation; then the skill to edit the form")
        .contains("skill", "axonivy-designer-new_axon_ivy_dialog")
        .doesNotContain("web_fetch"); // skill cache!

    assertThat(spans.usedTools())
        .filteredOn(t -> t.name().equals("view"))
        .extracting(UsedTool::arguments)
        .as("schema read was enforced by skill")
        .anyMatch(args -> args.contains("skills/ivy-json-files/schemas/14.0/project/form.json"));
  }

  @Test
  @Order(2)
  void jsfDialog(AgentRuntime rt) throws Exception {
    var spans = rt.prompt("""
        create a new JSF dialog 'OrderOverview' in 'purchase' project.
        The view lets the user enter an order: 'product' (text), 'quantity' (number) and 'deliveryDate' (date),
        each bound to the dialog data.
        """);

    var purchase = rt.ivyWorkspace().path().resolve("purchase");
    var view = findFile(purchase.resolve("dialog"), "OrderOverview.xhtml");
    assertThat(view.getParent().toFile().list())
        .as("JSF dialog consists of view, data class and process")
        .containsExactlyInAnyOrder("OrderOverview.xhtml", "OrderOverviewData.d.json", "OrderOverviewProcess.p.json");

    assertOrderData(view.resolveSibling("OrderOverviewData.d.json"));

    assertThat(view).content()
        .as("requested template is used by the view")
        .contains("template=\"/layouts/frame-10.xhtml\"");
    assertThat(view).content()
        .as("view components are bound to the data attributes")
        .contains("#{data.product}", "#{data.quantity}", "#{data.deliveryDate}");

    assertThat(spans.usedTools())
        .extracting(UsedTool::name)
        .as("Must use create-tool for initial correct creation; then the skill to edit the data class")
        .contains("skill", "axonivy-designer-new_axon_ivy_dialog")
        .doesNotContain("web_fetch"); // skill cache!

    assertThat(spans.usedTools())
        .filteredOn(t -> t.name().equals("view"))
        .extracting(UsedTool::arguments)
        .as("schema read was enforced by skill")
        .anyMatch(args -> args.contains("skills/ivy-json-files/schemas/14.0/project/data-class.json"));
  }

  private static void assertOrderData(Path dataClass) throws IOException {
    var dataJson = readJson(dataClass);
    var fieldTypes = dataJson.path("fields").valueStream()
        .collect(Collectors.toMap(f -> f.path("name").asString(), f -> f.path("type").asString()));
    assertThat(fieldTypes)
        .as("bound attributes exist in dialog data class: %s", dataJson.toPrettyString())
        .containsKeys("product", "quantity", "deliveryDate");
    assertThat(fieldTypes.get("product"))
        .isIn("", "String", "java.lang.String");
    assertThat(fieldTypes.get("quantity"))
        .matches("Number|java\\.lang\\.(Number|Integer|Long|Double)|java\\.math\\.BigDecimal");
    assertThat(fieldTypes.get("deliveryDate"))
        .matches("Date|ch\\.ivyteam\\.ivy\\.scripting\\.objects\\.Date|java\\.util\\.Date|java\\.time\\.LocalDate");
  }

  private static Path findFile(Path dir, String fileName) throws IOException {
    try (var files = Files.walk(dir)) {
      return files.filter(f -> f.getFileName().toString().equals(fileName))
          .findFirst().orElseThrow(() -> new IllegalStateException(fileName + " not found in " + dir));
    }
  }

  private static JsonNode readJson(Path file) throws IOException {
    try (var in = Files.newInputStream(file)) {
      return JsonMapper.shared().readTree(in);
    }
  }

  private static JsonNode procElement(JsonNode process, String type) {
    return process.path("elements").valueStream()
        .filter(e -> type.equals(e.path("type").asString()))
        .findFirst().orElseThrow(() -> new IllegalStateException(type + " not found in " + process.toPrettyString()));
  }

}
