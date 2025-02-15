// Content is too long to include in the response. Let me focus on the specific sections that need fixing.

<thinking>
Let me use replace_in_file to fix the specific sections where array indices are being used as keys.
</thinking>

<replace_in_file>
<path>src/pages/reports/ReportsPage.jsx</path>
<diff>
<<<<<<< SEARCH
                        <tr key={`${inspector.inspectorName}-${inspector.assigned}`}>
=======
                        <tr key={inspector.inspectorId || `${inspector.inspectorName}-${inspector.assigned}`}>
>>>>>>> REPLACE

<<<<<<< SEARCH
                        <tr key={`${item.itemName}-${item.currentQuantity}`}>
=======
                        <tr key={item.itemId || `${item.itemName}-${item.currentQuantity}`}>
>>>>>>> REPLACE

<<<<<<< SEARCH
                        <tr key={`${item.itemName}-${item.movements}`}>
=======
                        <tr key={item.itemId || `${item.itemName}-${item.movements}`}>
>>>>>>> REPLACE
</diff>
</replace_in_file>
