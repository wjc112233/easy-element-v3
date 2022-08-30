import { omit } from "lodash-es"
import { getCurrentInstance, onBeforeMount, ref, h, type Slots } from "vue"
import type { VPopupInstance, VPopupProps } from "./popup"
import Popup from './popup.vue'

type PopupConfig<T = any> = Partial<VPopupProps> & {
  beforeShow?: (params?: T) => Promise<false | void> | false | void
}

export const usePopup = function<T>(config: PopupConfig<T>, slots?: Slots) {
  const vm: any = getCurrentInstance()
  const popupRef = ref<VPopupInstance>()

  onBeforeMount(() => {
    const originalRender = vm.render
    vm.render = function (...args: any[]) {
      const vnode = (
        <Popup
          ref={popupRef}
          {...omit(config, 'beforeShow')}
        >
          {{
            default: () => originalRender(...args),
            ...slots
          }}
        </Popup>
      )
      return vnode
    }
  })

  return {
    show: async(params?: T) => {
      if (config.beforeShow) {
        const ret = await config.beforeShow(params)
        if (ret === false) {
          return
        }
      }
      popupRef.value?.show()
    },
    close: () => popupRef.value?.close(),
    setContentLoading: (val: boolean) => popupRef.value?.setContentLoading(val),
    reload: () => popupRef.value?.reload(),
    toggleIsFullscreen: () => popupRef.value?.toggleIsFullscreen(),
  }
}