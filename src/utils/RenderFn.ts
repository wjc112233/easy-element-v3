import { type VNode, h } from 'vue'

export const RenderFn: RenderFnType = (props) => {
  return h(props.component, props)
}

export type RenderFnType<T = any> = (props: T) => VNode
