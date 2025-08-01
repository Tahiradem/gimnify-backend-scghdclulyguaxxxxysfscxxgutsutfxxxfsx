/**
 * Adjusts table column widths based on content
 */
function adjustColumnWidths() {
    try {
        const table = document.getElementById("dynamicTable");
        if (!table) {
            console.warn("Table with ID 'dynamicTable' not found");
            return;
        }

        // First reset any existing widths
        const headers = table.querySelectorAll("th");
        headers.forEach(header => {
            header.style.width = '';
            header.style.minWidth = '';
        });

        // Force browser to recalculate layout
        table.style.tableLayout = 'auto';
        void table.offsetHeight; // Trigger reflow

        const tableBody = table.querySelector("tbody");
        if (!tableBody) return;

        // Initialize column widths array
        const columns = Array.from(headers).map(() => 0);

        // Measure content width in all rows
        const rows = tableBody.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            cells.forEach((cell, index) => {
                if (index < columns.length) {
                    // Get the full content width including padding
                    const cellWidth = cell.scrollWidth;
                    columns[index] = Math.max(columns[index], cellWidth);
                }
            });
        });

        // Also measure header widths
        headers.forEach((header, index) => {
            columns[index] = Math.max(columns[index], header.scrollWidth);
        });

        // Apply calculated widths with padding
        headers.forEach((header, index) => {
            if (index < columns.length) {
                header.style.width = `${columns[index] + 20}px`;
                header.style.minWidth = `${columns[index] + 20}px`;
            }
        });

        // Lock the table layout after resizing
        table.style.tableLayout = 'fixed';

        console.log("Column widths adjusted successfully");
    } catch (error) {
        console.error("Error adjusting column widths:", error);
    }
}

// Debounce function to prevent excessive calls
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Call this after your table data loads and after window resize
window.addEventListener('resize', debounce(adjustColumnWidths, 200));

function dashboard_display_btn() {
    if (localStorage.getItem('boolForDashboard') === 'true') {
        document.querySelector(".no_chart_display").style.display = 'none';
        document.querySelector(".dashboardDataAnalys").style.opacity = '1000%';
        localStorage.setItem('boolForDashboard', false);
        document.querySelector("#hide_btn").className = 'fa fa-eye-slash';
    } else {
        document.querySelector(".no_chart_display").style.display = 'flex';
        document.querySelector(".dashboardDataAnalys").style.opacity = '0%';
        localStorage.setItem('boolForDashboard', true);
        document.querySelector("#hide_btn").className = 'fa fa-eye';
    }
}

function Distroy_editing_box() {
    document.querySelector(".editing_box").style.display = 'none';
}

// Clean up charts before unloading
window.addEventListener('beforeunload', () => {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
});

// Initialize when page loads
window.onload = () => {
    fetchData();
    loadSearchTerm();
    
    // Set up periodic updates
    setInterval(countCheckedUnchecked, 3000);
    setInterval(() => fetchData(), 300000);
};