# Defects by Production Month Chart

## Overview
This component displays a bar chart showing the number of defects for each month based on the products' production dates. It's designed to help identify patterns in product quality over time.

## Features

### Date Range Validation
- **Minimum Range**: The chart only displays when the selected date range is at least one month (30 days)
- **Placeholder Message**: When the date range is less than one month, a placeholder message is shown instead of the chart
- **User Guidance**: The placeholder clearly explains why the chart isn't shown and what the user needs to do

### Chart Display
- **Bar Chart**: Uses Recharts library to display defect counts as bars
- **X-Axis**: Shows production months in Turkish format (e.g., "Oca 2024", "Şub 2024")
- **Y-Axis**: Shows defect counts
- **Tooltips**: Displays detailed information when hovering over bars
- **Responsive**: Adapts to different screen sizes

### Data Processing
- **Backend Endpoint**: `/reports/defects-by-production-month`
- **Data Source**: Groups return case items by their production date (month)
- **Filtering**: Only includes items with valid production dates
- **Sorting**: Results are ordered chronologically by production month

## Technical Implementation

### Backend (Python/Flask)
```python
@reports_bp.route("/reports/defects-by-production-month", methods=["GET"])
def defects_by_production_month():
    # Validates date range (minimum 30 days)
    # Queries database for defects grouped by production month
    # Returns JSON with month and defect_count
```

### Frontend (React/TypeScript)
```typescript
// Component: DefectsByProductionMonthChart
// Props: startDate, endDate, refreshKey
// Features: Date validation, error handling, loading states
```

### Database Query
```sql
SELECT 
    SUBSTRING(production_date, 1, 7) as production_month,
    COUNT(id) as defect_count
FROM return_case_items
JOIN return_cases ON return_case_items.return_case_id = return_cases.id
WHERE arrival_date BETWEEN start_date AND end_date
    AND production_date IS NOT NULL
GROUP BY SUBSTRING(production_date, 1, 7)
ORDER BY production_month
```

## Usage

1. Navigate to the Statistics page (`/statistics`)
2. Select a date range of at least one month
3. Click "Uygula" (Apply)
4. The chart will appear in the "Üretim Tarihine Göre Hata Dağılımı" section

## Error Handling

- **Short Date Range**: Shows placeholder message
- **No Data**: Shows "Veri bulunamadı" message
- **Network Errors**: Displays error message
- **Loading State**: Shows "Yükleniyor..." during data fetch

## Future Enhancements

- Add trend lines to show defect rate changes over time
- Include product type filtering
- Add export functionality for chart data
- Implement drill-down to see individual cases for each month
