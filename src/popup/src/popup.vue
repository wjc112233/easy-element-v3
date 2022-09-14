<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import { ElButton, ElDialog, ElLoading } from 'element-plus'
import { isEmpty, omit } from 'lodash-es'
import { type VPopupProps, _propsOptions } from './popup'
import type { Mutable } from 'element-plus/es/utils'
import { generateId } from '@/utils'

const vm = getCurrentInstance()

const props: VPopupProps = defineProps(_propsOptions)
const isVisible = ref(false)

const tasks: (() => void)[] = []
const handleTask = (task: () => void) => {
  if (isVisible.value) {
    task()
  } else {
    tasks.push(task)
  }
}
watch(isVisible, (val) => {
  if (val && !isEmpty(tasks)) {
    nextTick(() => {
      tasks.forEach((done) => done())
      tasks.length = 0
    })
  }
})

let loading: any = null
let bodyEl: any = null
const setContentLoading = (val: boolean) => {
  if (val) {
    !loading &&
      handleTask(() => {
        loading = ElLoading.service({
          target: bodyEl || (bodyEl = document.querySelector(`.${_class}`)),
          lock: true,
        })
      })
  } else {
    loading?.close()
    loading = null
  }
}

const contentKey = ref(0)
const reload = () => {
  handleTask(() => {
    contentKey.value = Date.now()
  })
}

const isFullscreen = ref(!!vm?.attrs.fullscreen)
const toggleIsFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}
const _class = `dialog-${generateId()}`
// 判断父组件链上是否有el-dialog
const hasPopupInChains = (() => {
  let parent = vm!.parent
  while (parent) {
    if (parent?.proxy?.$options.name === 'ElDialog') {
      return true
    } else {
      parent = parent.parent
    }
  }
  return false
})()
const dialogAttrs = computed(() => {
  const attrs = { ...vm?.attrs } as Mutable<
    InstanceType<typeof ElDialog>['$props']
  >
  attrs.appendToBody = attrs.appendToBody ?? hasPopupInChains
  attrs.customClass = `${attrs.customClass || ''} ${_class}`
  // 没有设置宽度的话，就使用自适应宽度
  if (!attrs.width) {
    attrs.width = 'auto'
    attrs.customClass +=
      ' el-col-xs-22 el-col-sm-22 el-col-md-12 el-col-lg-12 el-col-xl-8'
  }
  if (props.fullscreenable) {
    attrs.fullscreen = isFullscreen.value
  }
  return attrs
})

const close = () => {
  isVisible.value = false
  setContentLoading(false)
}

const show = () => {
  isVisible.value = true
}

const handleConfirm = async () => {
  await props.footer!.onConfirm()
  close()
}

defineExpose({
  close,
  show,
  setContentLoading,
  reload,
  toggleIsFullscreen,
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <ElDialog v-model="isVisible" v-bind="dialogAttrs">
    <template #header="scoped">
      <slot name="header" v-bind="scoped">
        <span :id="scoped.titleId" :class="scoped.titleClass">{{
          dialogAttrs.title
        }}</span>
        <span
          v-if="fullscreenable"
          class="el-dialog__headerbtn full-screen-icon"
          @click="toggleIsFullscreen"
        >
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              v-if="!isFullscreen"
              d="M95.500388 368.593511c0 11.905658-9.637914 21.543572-21.543573 21.543572-11.877311 0-21.515225-9.637914-21.515225-21.543572V188.704684c0-37.502824 15.307275-71.575684 39.997343-96.265751s58.762928-39.997342 96.265751-39.997343h179.888827c11.905658 0 21.543572 9.637914 21.543572 21.515225 0 11.905658-9.637914 21.543572-21.543572 21.543573H188.704684c-25.625512 0-48.926586 10.488318-65.821282 27.383014s-27.383014 40.19577-27.383014 65.821282v179.888827z m559.906101-273.093123c-11.877311 0-21.515225-9.637914-21.515226-21.543573 0-11.877311 9.637914-21.515225 21.515226-21.515225h179.917174c37.502824 0 71.547337 15.307275 96.237404 39.997343s40.025689 58.762928 40.02569 96.265751v179.888827c0 11.905658-9.637914 21.543572-21.543572 21.543572-11.877311 0-21.515225-9.637914-21.515226-21.543572V188.704684c0-25.625512-10.488318-48.926586-27.411361-65.821282-16.894696-16.894696-40.19577-27.383014-65.792935-27.383014h-179.917174z m273.12147 559.906101c0-11.877311 9.637914-21.515225 21.515226-21.515226 11.905658 0 21.543572 9.637914 21.543572 21.515226v179.917174c0 37.474477-15.335622 71.547337-40.02569 96.237404s-58.734581 39.997342-96.237404 39.997343h-179.917174c-11.877311 0-21.515225-9.637914-21.515226-21.515225s9.637914-21.543572 21.515226-21.543573h179.917174c25.597165 0 48.898239-10.488318 65.792935-27.383014 16.923043-16.894696 27.411361-40.19577 27.411361-65.792935v-179.917174z m-559.934448 273.093123c11.905658 0 21.543572 9.666261 21.543572 21.543573s-9.637914 21.515225-21.543572 21.515225H188.704684c-37.502824 0-71.575684-15.307275-96.265751-39.997343s-39.997342-58.762928-39.997343-96.237404v-179.917174c0-11.877311 9.637914-21.515225 21.515225-21.515226 11.905658 0 21.543572 9.637914 21.543573 21.515226v179.917174c0 25.597165 10.488318 48.898239 27.383014 65.792935s40.19577 27.383014 65.821282 27.383014h179.888827z"
            />
            <path
              v-else
              d="M65.991363 679.954822c-12.104086 0-21.912081-9.807995-21.912081-21.91208s9.807995-21.912081 21.912081-21.912081h183.177057c38.183147 0 72.85129 15.590743 97.994906 40.734359 25.143616 25.11527 40.734359 59.811759 40.73436 97.994907v183.177057c0 12.104086-9.807995 21.912081-21.912081 21.91208s-21.912081-9.807995-21.91208-21.91208v-183.177057c0-26.079061-10.686746-49.805337-27.893257-67.011848s-40.932787-27.893257-67.011848-27.893257H65.991363z m613.935112 278.082162c0 12.104086-9.807995 21.912081-21.91208 21.91208s-21.912081-9.807995-21.912081-21.91208v-183.177057c0-38.183147 15.590743-72.85129 40.73436-97.994907 25.11527-25.143616 59.811759-40.734359 97.994906-40.734359h183.205404c12.104086 0 21.912081 9.807995 21.91208 21.912081s-9.807995 21.912081-21.91208 21.91208h-183.205404c-26.079061 0-49.805337 10.686746-67.011848 27.893257s-27.893257 40.932787-27.893257 67.011848v183.177057z m278.110509-613.963459c12.104086 0 21.912081 9.807995 21.91208 21.91208s-9.807995 21.912081-21.91208 21.912081h-183.205404c-38.183147 0-72.85129-15.590743-97.994906-40.73436s-40.734359-59.840106-40.73436-97.994906V65.963016c0-12.104086 9.807995-21.912081 21.912081-21.91208s21.912081 9.807995 21.91208 21.91208v183.205404c0 26.050714 10.686746 49.77699 27.893257 66.983501 17.206511 17.234858 40.932787 27.921603 67.011848 27.921604h183.205404zM344.073525 65.963016c0-12.104086 9.807995-21.912081 21.91208-21.91208s21.912081 9.807995 21.912081 21.91208v183.205404c0 38.1548-15.590743 72.85129-40.73436 97.994906s-59.811759 40.734359-97.994906 40.73436H65.991363c-12.104086 0-21.912081-9.807995-21.912081-21.912081s9.807995-21.912081 21.912081-21.91208h183.177057c26.079061 0 49.805337-10.686746 67.011848-27.893257 17.206511-17.234858 27.893257-40.932787 27.893257-67.011848V65.963016z"
            />
          </svg>
        </span>
      </slot>
    </template>

    <slot :key="contentKey" />

    <template #footer>
      <div v-if="props.footer" style="margin-top: 20px; text-align: end">
        <ElButton
          v-if="props.footer.cancelButton !== false"
          v-bind="omit(props.footer.cancelButton, 'buttonText')"
          @click="close"
        >
          {{ props.footer.cancelButton?.buttonText ?? '关闭' }}
        </ElButton>
        <ElButton
          v-bind="
            Object.assign(
              { type: 'primary' },
              omit(props.footer.confirmButton, 'buttonText')
            )
          "
          @click="handleConfirm"
        >
          {{ props.footer.confirmButton?.buttonText ?? '确定' }}
        </ElButton>
      </div>
      <slot v-else name="footer" />
    </template>
  </ElDialog>
</template>

<style lang="less" scoped>
.full-screen-icon {
  right: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  top: 3px;

  &:hover svg path {
    fill: var(--el-color-primary) !important;
  }

  svg {
    height: 16px;
    width: 17px;

    path {
      fill: var(--el-color-info);
    }
  }
}
</style>
