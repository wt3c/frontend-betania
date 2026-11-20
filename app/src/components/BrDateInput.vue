<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { applyBrDateMask, formatBrDate, parseBrDate } from '../brDate'

// Native date inputs follow the browser language, so they cannot guarantee dd/mm/aaaa.
const props = withDefaults(defineProps<{ modelValue?: string; withTime?: boolean }>(), {
  modelValue: '',
  withTime: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const placeholder = props.withTime ? 'dd/mm/aaaa hh:mm' : 'dd/mm/aaaa'
const input = ref<HTMLInputElement>()
const text = ref(formatBrDate(props.modelValue))

function validate() {
  const invalid = text.value && !parseBrDate(text.value, props.withTime)
  input.value?.setCustomValidity(invalid ? `Informe uma data válida: ${placeholder}.` : '')
}

function onInput(event: Event) {
  text.value = applyBrDateMask(event.target as HTMLInputElement, props.withTime)
  emit('update:modelValue', parseBrDate(text.value, props.withTime))
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== parseBrDate(text.value, props.withTime)) text.value = formatBrDate(value)
  },
)
watch(text, validate, { flush: 'post' })
onMounted(validate)
</script>

<template>
  <input
    ref="input"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :placeholder="placeholder"
    :value="text"
    @input="onInput"
  />
</template>
