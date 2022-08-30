import type { FormProps } from 'element-plus'
import { DefaultAttrs } from './DefaultAttrs'

export const defaultFormAttrs = new DefaultAttrs<Partial<FormProps>>({
  validateOnRuleChange: false,
})
