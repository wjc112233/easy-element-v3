import type { ButtonProps } from 'element-plus'
import type { Mutable } from 'element-plus/es/utils'

export type SetDataFn<Obj> = <Key extends keyof Obj, Value extends Obj[Key]>(
  key: Key,
  value: Value
) => any

export interface ButtonWithText extends PartialMutable<ButtonProps> {
  buttonText?: string
}

export type MergeAttrs<
  Props = Record<string, any>,
  Events = Record<string, any>
> = Props &
  Events &
  WithNativeAttrs<{
    ref?: import('vue').VNodeRef
  }>

export type WithNativeAttrs<T> = T & { style?: string; class?: string }

/**
 * 替换类型
 * ```typescript
 * type Obj = {
 *    a: string
 *    b: boolean
 * }
 *
 * type NewObj = ReplaceType<Obj, { a: number }>
 * // => { a: number; b: boolean }
 * ```
 */
export type ReplaceType<
  Obj,
  Obj1 extends {
    [k in keyof Obj]?: any
  }
> = Omit<Obj, keyof Obj1> & {
  [k in keyof Obj1]: Obj1[k]
}

/**
 * 去除联合类型T中为E的类型
 * @example
 * ```typescript
 * type T = string | number | boolean
 * type E = number
 * type Res = RemoveUnionType<T, E>
 * // => string | boolean
 * ```
 */
export type RemoveUnionType<T, E> = T extends E ? never : T

export type PartialMutable<T> = Partial<Mutable<T>>

export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>
