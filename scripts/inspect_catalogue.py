"""Inspect the Haji Queens master catalogue XLSX: sheets, headers, rows."""
import openpyxl

wb = openpyxl.load_workbook("/home/z/my-project/upload/MASTER_PRODUCT_CATALOGUE.xlsx", data_only=True)
print("SHEETS:", wb.sheetnames)
for name in wb.sheetnames:
    ws = wb[name]
    print(f"\n=== SHEET: {name}  ({ws.max_row} rows x {ws.max_column} cols) ===")
    for row in ws.iter_rows(values_only=True):
        vals = [str(v) if v is not None else "" for v in row]
        # trim trailing empties
        while vals and vals[-1] == "":
            vals.pop()
        if vals:
            print(" | ".join(vals))
