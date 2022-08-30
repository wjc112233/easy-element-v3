import VForm from './src/form.vue'
import type { VFormConfig, VFormConstructor } from './src/form'

export function defineVForm<FormModel = Record<string, any>>(
  formConfig: VFormConfig<FormModel>
) {
  return {
    formConfig,
    VForm: VForm as unknown as VFormConstructor<FormModel>,
  }
}
export { VForm }
export * from './src/form'
export * from './src/components'
