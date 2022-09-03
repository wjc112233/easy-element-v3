<script lang="tsx">
import { type PropType, type Slots, computed, defineComponent, h } from 'vue'
import { ElTableColumn, ElTag } from 'element-plus'
import { get, isString } from 'lodash-es'
import type { Columns, VTableColumn } from './crud'
import type { Mutable } from 'element-plus/es/utils'

export default defineComponent({
  props: {
    columns: {
      type: Object as PropType<Columns>,
      required: true,
    },
  },
  setup(props) {
    const resolveColumns = (columns: Columns) => {
      columns = { ...columns }

      for (const k in columns) {
        let col = isString(columns[k])
          ? { label: columns[k] as string }
          : (columns[k] as VTableColumn)

        if (col.children) {
          col.children = resolveColumns(col.children)
        }

        // 处理存在数据字典的情况
        if (col.dicts) {
          col = Object.assign(
            {
              renderContent({ value, dict }) {
                if (dict?.textColor) {
                  return h(
                    'span',
                    { style: `color:${dict.textColor}` },
                    dict.label
                  )
                } else if (dict?.tag !== undefined) {
                  return h(
                    ElTag,
                    isString(dict.tag) ? { type: dict.tag } : dict.tag,
                    { default: () => dict.label }
                  )
                } else {
                  return h('span', dict?.label ?? value)
                }
              },
            } as VTableColumn,
            col
          )
        }

        columns[k] = col
      }
      return columns as Record<string, VTableColumn>
    }
    const tableColumns = computed(() => resolveColumns(props.columns))

    const renderFieldColumns = (
      columns: Record<string, VTableColumn>,
      pathKey?: string
    ) => {
      return Object.keys(columns).map((prop, index) => {
        const col = columns[prop]
        const propWithPath = pathKey ? `${pathKey}.${prop}` : prop

        const slots: Mutable<Slots> = {}
        // 自定义列头
        if (col.renderHeader) {
          slots.header = (scope) => {
            return [col.renderHeader!(scope)]
          }
        }
        // 有多级表头的话，就处理多级表头
        // 其次，存在自定义列内容，就使用自定义列内容
        if (col.children) {
          slots.default = () =>
            renderFieldColumns(
              col.children as Record<string, VTableColumn>,
              propWithPath
            )
        } else if (col.renderContent) {
          slots.default = (scope) => {
            return [
              col.renderContent!.call(col, {
                value: get(scope.row, propWithPath),
                dict: col.dicts?.find((d) => d.value === scope.row[prop]),
                ...scope,
              }),
            ]
          }
        }

        return (
          <ElTableColumn
            key={index}
            width={col.width}
            label={col.label}
            formatter={col.formatter}
            prop={propWithPath}
            {...col.attrs}
          >
            {slots}
          </ElTableColumn>
        )
      })
    }

    return () => renderFieldColumns(tableColumns.value)
  },
})
</script>
