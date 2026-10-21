package ch.ivyteam.smart.core.assertion;

import static org.assertj.core.api.WritableAssertionInfo.mostRelevantDescriptionIn;

import java.util.List;
import java.util.Objects;

import org.assertj.core.api.AbstractAssert;
import org.assertj.core.api.Assertions;
import org.assertj.core.api.ListAssert;

import ch.ivyteam.smart.core.aspire.AspireSpans;
import ch.ivyteam.smart.core.aspire.AspireSpans.UsedTool;

public class AspireSpansAssert extends AbstractAssert<AspireSpansAssert, AspireSpans> {

  public static AspireSpansAssert assertThat(AspireSpans spans) {
    return new AspireSpansAssert(spans);
  }

  private AspireSpansAssert(AspireSpans spans) {
    super(spans, AspireSpansAssert.class);
  }

  public AspireSpansAssert usedTools(String... tools) {
    Assertions.assertThat(toolNames()).as(describe("used tools")).contains(tools);
    return this;
  }

  public AspireSpansAssert didNotUseTools(String... tools) {
    Assertions.assertThat(toolNames()).as(describe("used tools")).doesNotContain(tools);
    return this;
  }

  public AspireSpansAssert loadedSkill(String skill) {
    Assertions.assertThat(arguments("skill")).as(describe("loaded skill " + skill)).anyMatch(args -> args.contains(skill));
    return this;
  }

  public AspireSpansAssert viewed(String... paths) {
    var viewed = arguments("view");
    for (var path : paths) {
      Assertions.assertThat(viewed).as(describe("viewed " + path)).anyMatch(args -> args.contains(path));
    }
    return this;
  }

  public AspireSpansAssert calledToolWithout(String tool, String... arguments) {
    var calls = arguments(tool);
    for (var argument : arguments) {
      Assertions.assertThat(calls).as(describe(tool + " called without " + argument)).noneMatch(args -> args.contains(argument));
    }
    return this;
  }

  public ListAssert<String> toolCallArguments(String tool) {
    return Assertions.assertThat(arguments(tool)).as(describe("arguments of " + tool + " calls"));
  }

  public AspireSpansAssert usedTokensBelow(int input, int output) {
    var usage = actual.tokenUsage();
    Assertions.assertThat(usage.input()).as(describe("input tokens")).isLessThan(input);
    Assertions.assertThat(usage.output()).as(describe("output tokens")).isLessThan(output);
    return this;
  }

  private List<String> toolNames() {
    return actual.usedTools().stream().map(UsedTool::name).toList();
  }

  private List<String> arguments(String tool) {
    return actual.usedTools().stream()
        .filter(t -> t.name().equals(tool))
        .map(UsedTool::arguments)
        .filter(Objects::nonNull)
        .toList();
  }

  private String describe(String check) {
    return mostRelevantDescriptionIn(info, check);
  }

}
