package ch.ivyteam.smart.core.assertion;

import static ch.ivyteam.smart.core.assertion.AspireSpansAssert.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import ch.ivyteam.smart.core.aspire.AspireSpans;
import ch.ivyteam.smart.core.aspire.TestAspireSpans;

public class TestAspireSpansAssert {

  private final AspireSpans spans = TestAspireSpans.read("spans-copilot.json");

  @Test
  void passes() {
    assertThat(spans)
        .usedTools("axonivy-designer-new_axon_ivy_project")
        .didNotUseTools("web_fetch", "web_search")
        .calledToolWithout("axonivy-designer-new_axon_ivy_project", "namespace")
        .usedTokensBelow(40_000, 1_000);
    assertThat(spans).toolCallArguments("axonivy-designer-new_axon_ivy_project")
        .singleElement().asString().contains("flight-simulator");
  }

  @Test
  void failsWithCheckName() {
    assertThatThrownBy(() -> assertThat(spans).viewed("schemas/project/process.json"))
        .hasMessageContaining("[viewed schemas/project/process.json]");
    assertThatThrownBy(() -> assertThat(spans).loadedSkill("ivy-yaml-files"))
        .hasMessageContaining("[loaded skill ivy-yaml-files]");
    assertThatThrownBy(() -> assertThat(spans).calledToolWithout("axonivy-designer-new_axon_ivy_project", "flight-simulator"))
        .hasMessageContaining("called without flight-simulator");
    assertThatThrownBy(() -> assertThat(spans).usedTokensBelow(30_000, 1_000))
        .hasMessageContaining("[input tokens]");
  }

  @Test
  void failsWithOwnDescription() {
    assertThatThrownBy(() -> assertThat(spans).as("must create the process").usedTools("axonivy-designer-new_axon_ivy_process"))
        .hasMessageContaining("[must create the process]");
  }

}
