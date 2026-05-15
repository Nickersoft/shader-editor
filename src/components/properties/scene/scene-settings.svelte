<script>
  import { composer } from "@/lib/state";

  import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

  import * as Inputs from "../inputs";

  import PanelSection from "../panel-section.svelte";
</script>

<PanelSection>
  <Field>
    <FieldLabel>Background</FieldLabel>
    <FieldContent>
      <Inputs.Color
        value={composer.scene.background.color}
        onChange={(v) =>
          composer.updateSceneBackground([
            v[0] ?? 0,
            v[1] ?? 0,
            v[2] ?? 0,
            v[3] ?? 1,
          ])}
      />
    </FieldContent>
  </Field>
</PanelSection>
