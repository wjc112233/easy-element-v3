import type { FormControlComponent } from '../form'
import { DefaultAttrs } from '@/default/DefaultAttrs'

export * from './select'
export * from './input'
export * from './inputNumber'
export * from './datePicker'
export * from './radio'
export * from './cascader'
export * from './checkbox'
export * from './slider'
export * from './switch'

export const components = new DefaultAttrs<
  Record<string, FormControlComponent>
>({})
