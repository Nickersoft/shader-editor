<script lang="ts">
  import { ColorPicker } from "@/components/ui/color-picker";

  interface Props {
    value: number[];
    onChange: (value: number[]) => void;
    onCommit?: (value: number[]) => void;
  }

  let { value, onChange, onCommit }: Props = $props();

  let hasAlpha = $derived(value.length === 4);
</script>

<ColorPicker {value} alpha={hasAlpha} {onChange} {onCommit} />
