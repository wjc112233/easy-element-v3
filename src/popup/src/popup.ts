import type { ButtonWithText } from '@/utils/typescript'
import type { ElDialog } from 'element-plus'
import type { Mutable } from 'element-plus/es/utils'
import type { ExtractPropTypes, PropType } from 'vue'
export interface PopupFooter {
  cancelButton?: false | ButtonWithText
  confirmButton?: ButtonWithText
  onConfirm: () => void
}
type DialogAttrs = InstanceType<typeof ElDialog>['$props']
export const _propsOptions = {
  fullscreenable: Boolean,
  footer: Object as PropType<PopupFooter>,
}
export type VPopupProps = ExtractPropTypes<typeof _propsOptions> &
  Mutable<Omit<DialogAttrs, 'modelValue'>>
export type VPopupInstance = InstanceType<typeof import('./popup.vue').default>
