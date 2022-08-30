import { ref, type Ref, nextTick, reactive, onMounted, getCurrentInstance } from 'vue'
import { isArray } from 'lodash-es'
import type { CrudConfig, ElTableInstance } from './crud'
import { ElLoading } from 'element-plus'

export function useData<
  DataItem = Record<string, any>,
  Query = Record<string, any>,
>({
  config,
  elTableRef,
}: {
  config: CrudConfig<DataItem, Query>
  elTableRef: Ref<ElTableInstance | undefined>
}) {
  const vm = getCurrentInstance()

  // 用来重载table组件
  const tableKey = ref(Symbol())
  const tableData = reactive<Array<DataItem>>([])
  const currentPage = ref(1)
  const totalPages = ref<number>()
  const totalCount = ref<number>()
  const pageSize = ref(config.paginationAttrs?.defaultPageSize ?? 10)
  // 请求出现错误
  const isError = ref(false)
  // 是否已经初始化过
  let initialized = false
  let query: Record<string, any> = {}

  // 获取表格数据
  const getTableData = async () => {
    const loading = ElLoading.service({
      lock: true,
      target: vm?.proxy?.$el.querySelector('.el-table')
    })
    try {
      const res = await config.requestApi({
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        ...query
      } as any)

      // 重载table组件
      if (isError.value || tableData.length === 0) {
        tableKey.value = Symbol()
        isError.value = false
      }

      if (isArray(res.data)) {
        tableData.splice(0, tableData.length, ...res.data as any)
      } else {
        console.error(
          '表格列表需要为一个数组，实际得到的数据为：',
          res.data
        )
      }

      totalPages.value = res.totalPages
      totalCount.value = res.count
      // pageSize.value = res.pageSize

      // 调用doLayout优化布局错误的问题
      if (!initialized) {
        nextTick(() => {
          elTableRef.value!.doLayout()
        })
      }

      // 重置y轴滚动
      nextTick(() => {
        elTableRef.value!.$el.querySelector('.el-table__body-wrapper').scrollTop = 0
      })

      initialized = true
    } catch (e) {
      isError.value = true
      tableData.length = 0
    } finally {
      loading.close()
    }
  }

  // 刷新
  const refresh = () => {
    getTableData()
  }

  // 搜索
  const search = (val: Query) => {
    query = val
    getTableData()
  }

  onMounted(() => {
    if (config.immediateRequest !== false) {
      getTableData()
    }
  })

  return {
    tableKey,
    tableData,
    isError,
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    getTableData,
    refresh,
    search,
  }
}
