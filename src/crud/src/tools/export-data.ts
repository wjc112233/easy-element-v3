import { get, isEmpty, isNumber } from 'lodash-es'
import { utils, writeFileXLSX } from 'xlsx'
import { normalizeColumn } from '../helpers'
import type { Columns, VTableColumn } from '../crud'

type ConfigItem = {
  label: string
  pathStr: string
  formatter?: VTableColumn['formatter']
  onlyChildren: boolean
  children: ConfigItem[]
}

export class ExportData {
  private columns: Columns
  private columnPaths: Array<Array<string>>
  private sourceData: Array<Record<string, any>>

  constructor(
    columnPaths: Array<Array<string>>,
    columns: Columns,
    sourceData: Array<Record<string, any>>,
    filename: string
  ) {
    this.columns = columns
    this.columnPaths = columnPaths
    this.sourceData = sourceData

    const config = this.getConfig()
    this.mergeConfigChildren(config)

    const { headers, datas } = this.generateHeadersAndDatas(config)

    const merges = this.getTableHeadersMerges(headers)

    const ws = utils.aoa_to_sheet([...headers, ...datas])
    merges.forEach((action) => {
      ;(ws['!merges'] || (ws['!merges'] = [])).push(utils.decode_range(action))
    })
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Data')
    writeFileXLSX(wb, `${filename}.xlsx`)
  }

  private getConfig() {
    const config: ConfigItem[] = []
    let index: number
    let prop: string
    let pathIndex: number
    let currentPath: Array<string>
    let currentPathStr: string
    let currentConfig: ConfigItem | undefined
    let parentConfigChildren: ConfigItem[] | undefined
    let parentColumns: Columns | undefined
    const getParentColumns = (path: Array<string>): Columns | undefined => {
      if (path.length === 1) {
        return this.columns
      } else {
        const p = get(this.columns, path.slice(0, -1).join('.children.'))
        return normalizeColumn(p)?.children
      }
    }
    let currentColumn: VTableColumn | undefined

    // 把路径列表转化为一个 ConfigItem[] 类型的列表
    this.columnPaths.forEach((path) => {
      pathIndex = 0
      parentConfigChildren = config
      while (pathIndex < path.length) {
        currentPath = path.slice(0, ++pathIndex)
        currentPathStr = currentPath.join('.')

        currentConfig = parentConfigChildren?.find(
          (item) => item && item.pathStr === currentPathStr
        )
        // 当前路径对应的config，如果存在的话，表示这个路径已经处理过了，继续处理下一层路径
        if (currentConfig) {
          parentConfigChildren =
            currentConfig.children || (currentConfig.children = [])
          continue
        }

        // 找寻当前路径对应的父级列，再找到当前列的下标、标题等等，添加进父级的config.children中
        prop = currentPath.slice(-1)[0]
        if (!isEmpty((parentColumns = getParentColumns(currentPath)))) {
          index = Object.keys(parentColumns!).indexOf(prop)
          currentColumn = normalizeColumn(parentColumns![prop])
          if (index > -1 && currentColumn?.label) {
            parentConfigChildren![index] = {
              pathStr: currentPathStr,
              label: currentColumn.label,
              formatter: currentColumn?.formatter,
              onlyChildren: !this.columnPaths.some(
                (p) => p.join('.') === currentPathStr
              ),
              children: [],
            }
            // 继续处理下一层
            parentConfigChildren = parentConfigChildren![index].children
          }
        }
      }
    })

    return config
  }

  /**
   * 处理存在onlyChildren配置的ConfigItem，比如
   * ```js
   * [
   *    { label: '列a' },
   *    {
   *      label: '列b',
   *      onlyChildren: true,
   *      children: [
   *        { label: '列b-1' },
   *        { label: '列b-2' },
   *      ]
   *    },
   *    { label: '列c' },
   * ]
   * // 变成
   * [
   *    { label: '列a' },
   *    { label: '列b-1' },
   *    { label: '列b-2' },
   *    { label: '列c' },
   * ]
   * ```
   */
  private mergeConfigChildren(conf: ConfigItem[]) {
    let i = 0
    let item: ConfigItem
    while (i < conf.length) {
      item = conf[i]
      if (!item) {
        conf.splice(i, 1)
        continue
      }

      if (item.onlyChildren) {
        conf.splice(i, 1, ...item.children)
      } else {
        this.mergeConfigChildren(item.children)
        i++
      }
    }
  }

  /**
   * 生成表格的表头和数据
   */
  private generateHeadersAndDatas(conf: ConfigItem[]) {
    const headers: Array<Array<string>> = []
    let subHeader: Array<string>
    const dataFns: Array<(data: Record<string, any>) => string> = []
    // 每一级列对应的额外下标, 比如：
    // [
    //   ['列a', '列b'],
    //   ['列a-1', '列a-2', '列a-3']
    // ]
    // 由于'列a'有3个子列，所以'列b'是应该右移2个位置的，变成：
    // [
    //   ['列a',   '',      , ''      , '列b'],
    //   ['列a-1', '列a-2', '列a-3']
    // ]
    // 右移的这个位置数就是额外下标
    const extraIndex: Array<number> = []
    // 列的真实下标, 比如：
    // [
    //   ['列a', '列b',            '列c'],
    //   [       '列b-1', '列b-2', '列c-1', '列c-2',]
    // ]
    // '列c-1'的真实下标应该为：父列'列c'的下标2 + 第1级列的额外下标1 + '列c-1'在相对于父列的下标0
    let realIndex = 0
    const resolveConfig = (conf: ConfigItem[], parentIndex = 0, level = 0) => {
      conf.forEach((item, index) => {
        subHeader = headers[level] || (headers[level] = [])
        realIndex = parentIndex + (extraIndex[level] || 0) + index
        subHeader[realIndex] = item.label
        dataFns[realIndex] = (data) => {
          return get(data, item.pathStr)
        }
        // 如果不存在子列的话，则所有父列的额外下标都应该加1
        // 存在的话就继续下沉到下一级子列处理
        if (item.children.length === 0) {
          let i = 0
          while (i < level) {
            if (isNumber(extraIndex[i])) {
              extraIndex[i]++
            } else {
              extraIndex[i] = 0
            }
            i++
          }
        } else {
          resolveConfig(item.children, parentIndex + index, level + 1)
        }
      })
    }
    resolveConfig(conf)

    return {
      headers,
      datas: this.sourceData.map((item: any) => {
        return dataFns.map((fn) => fn(item))
      }),
    }
  }

  /**
   * 获取列码
   */
  private getColumnCode(index: number, char = ''): string {
    const LETTERS_NUM = 26
    const multiple = Math.floor(index / LETTERS_NUM)
    const remainder = index % LETTERS_NUM

    const letter = String.fromCharCode(65 + remainder)
    char = letter + char

    return multiple > 0 ? this.getColumnCode(multiple, char) : char
  }

  /**
   * 表头合并，且对headers中空的位置补充一个空字符串
   * ```js
   *  [
        // A         B           C        D        E
        ['表头a', '表头b',              '表头c', '表头d'], // 1
        ['',      '表头b-1', '表头b-2'],                  // 2
      ]

      // 需要合并的为：
      ['A1:A2', 'B2:C3', 'D1:D2', 'E1:E2']

      // 整个过程为先竖向合并一次，再横向合并一次
      // 竖向合并就是找到['A1:A2', 'D1:D2', 'E1:E2']这些
      // 横向合并就是找到['B2:C3']这些
     ```
   */
  private getTableHeadersMerges(headers: Array<Array<string>>) {
    const mergeAction: string[] = []

    const maxColumns = Math.max(...(headers.map((sub) => sub.length) || 0))
    const maxRows = headers.length

    let currentColumnNum = 0
    let currentRowNum = 0

    // 记录已经被竖向合并过的格子
    // 用于横向合并时，若发现格子已经被竖向合并过了，则忽略它
    const yRecord: Record<string, true> = {}

    // 开始竖向合并
    let startY = -1
    let endY = -1
    const setY = () => {
      if (endY - startY > 0) {
        const currentCode = this.getColumnCode(currentColumnNum)
        mergeAction.push(
          `${currentCode}${startY + 1}:${currentCode}${endY + 1}`
        )
      }
    }
    while (currentColumnNum < maxColumns) {
      currentRowNum = 0
      while (currentRowNum < maxRows) {
        if (!headers[currentRowNum][currentColumnNum]) {
          headers[currentRowNum][currentColumnNum] = ''
          if (startY > -1) {
            endY++
            yRecord[`${currentRowNum}-${currentColumnNum}`] = true
          }
          currentRowNum === maxRows - 1 && setY()
        } else {
          setY()
          startY = endY = currentRowNum
        }
        currentRowNum++
      }
      startY = endY = -1
      currentColumnNum++
    }
    // 结束竖向合并

    // 开始横向合并
    let startX = -1
    let endX = -1
    const setX = () => {
      if (endX - startX > 0) {
        mergeAction.push(
          `${this.getColumnCode(startX)}${
            currentRowNum + 1
          }:${this.getColumnCode(endX)}${currentRowNum + 1}`
        )
      }
    }
    currentRowNum = 0
    while (currentRowNum < maxRows) {
      currentColumnNum = 0
      while (currentColumnNum < maxColumns) {
        if (!headers[currentRowNum][currentColumnNum]) {
          headers[currentRowNum][currentColumnNum] = ''
          if (yRecord[`${currentRowNum}-${currentColumnNum}`]) {
            setX()
            startX = endX = -1
          } else {
            if (startX > -1) {
              endX++
            }
            if (currentColumnNum === maxColumns - 1) {
              setX()
            }
          }
        } else {
          setX()
          startX = endX = currentColumnNum
        }
        currentColumnNum++
      }
      startX = endX = -1
      currentRowNum++
    }
    // 结束横向合并

    return mergeAction
  }
}
