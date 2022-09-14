import { h, inject } from 'vue'
import { ElIcon } from 'element-plus'
import { RefreshLeft } from '@element-plus/icons-vue'
import { crudInjectKey } from '../injectKeys'

export const RefreshTool = () => {
  const { refresh } = inject(crudInjectKey)!
  return (
    <ElIcon class="tool-icon" onClick={refresh}>
      {{
        default: () => <RefreshLeft />,
      }}
    </ElIcon>
  )
}
