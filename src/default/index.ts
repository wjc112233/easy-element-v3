import { DefaultAttrs } from './DefaultAttrs'
import type { FormProps } from 'element-plus'

export const defaultFormAttrs = new DefaultAttrs<Partial<FormProps>>({
  validateOnRuleChange: false,
})
