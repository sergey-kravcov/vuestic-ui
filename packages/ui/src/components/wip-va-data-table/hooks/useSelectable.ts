import {Ref, computed, watch, ref} from "vue";
import {TableRow, ITableItem} from "./useRows";

// the available options for the `select-mode` prop
export type TSelectMode = "single" | "multiple";

// TODO: the `emit` shouldn't be any!
export default function useSelectable(rows: Ref<TableRow[]>, selectedItems: Ref<ITableItem[]>, selectMode: Ref<TSelectMode>, emit: any) {
  // the standard proxying approach to work with modeled data
  const selectedItemsProxy = computed<ITableItem[]>({
    get() {
      return selectedItems.value;
    },

    set(modelValue) {
      emit("update:modelValue", modelValue);
    }
  });

  // clear all the selected rows when the `select-mode`'s value changes
  watch([selectMode], () => {
    unselectAllRows();
  });

  // private. The one calling this function must guarantee that the row isn't already selected
  function selectRow(row: TableRow) {
    selectedItemsProxy.value.push(row.source);
  }

  // private. The one calling this function must guarantee that the row is selected
  function unselectRow(row: TableRow) {
    selectedItemsProxy.value.splice(selectedItemsProxy.value.findIndex(item => item === row.source), 1);
  }

  // exposed
  function toggleRowSelection(row: TableRow) {
    if (isRowSelected(row) && selectedItemsProxy.value.length === 1) {
      unselectRow(row);
    } else {
      unselectAllRows();
      selectRow(row);
    }

    prevSelectedRowIndex.value = rows.value.indexOf(row);
    prevShiftSelectedRows.value.splice(0, prevShiftSelectedRows.value.length);
  }

  const prevSelectedRowIndex = ref(0);
  const prevShiftSelectedRows = ref<TableRow[]>([]);

  function ctrlSelectRow(row: TableRow) {
    if (selectMode.value === "single") return toggleRowSelection(row);

    if (isRowSelected(row)) {
      unselectRow(row);
    } else {
      selectRow(row);
    }
  }

  // exposed
  function shiftSelectRows(row: TableRow) {
    if (selectMode.value === "single") return toggleRowSelection(row);

    if (prevShiftSelectedRows) {
      prevShiftSelectedRows.value.forEach(prevShiftSelectedRow => {
        unselectRow(prevShiftSelectedRow);
      });

      prevShiftSelectedRows.value.splice(0, prevShiftSelectedRows.value.length);
    }

    const targetIndex = rows.value.indexOf(row);
    const start = Math.min(prevSelectedRowIndex.value, targetIndex);
    const end = Math.max(prevSelectedRowIndex.value, targetIndex);

    const rowsToSelect = rows.value.slice(start, end + 1).filter(rowToSelect => !isRowSelected(rowToSelect));
    selectedItemsProxy.value = selectedItemsProxy.value.concat(rowsToSelect.map(row => row.source));

    prevShiftSelectedRows.value = rowsToSelect;
  }

  // private
  function selectAllRows() {
    selectedItemsProxy.value = rows.value.map(row => row.source);
  }

  // private
  function unselectAllRows() {
    selectedItemsProxy.value.splice(0, selectedItemsProxy.value.length);
  }

  // exposed
  function toggleBulkSelection() {
    if (selectedItemsProxy.value.length === rows.value.length) {
      unselectAllRows();
    } else {
      selectAllRows();
    }
  }

  // the following 4 checkers are all exposed
  function isRowSelected(row: TableRow) {
    return selectedItemsProxy.value.includes(row.source);
  }

  const noRowsSelected = computed(() => {
    return selectedItemsProxy.value.length === 0;
  })

  const severalRowsSelected = computed(() => {
    return selectedItemsProxy.value.length > 0 && selectedItemsProxy.value.length < rows.value.length;
  });

  const allRowsSelected = computed(() => {
    return selectedItemsProxy.value.length
  });

  return {
    selectedItemsProxy,
    toggleRowSelection,
    ctrlSelectRow,
    shiftSelectRows,
    toggleBulkSelection,
    isRowSelected,
    noRowsSelected,
    severalRowsSelected,
    allRowsSelected,
  }
}
