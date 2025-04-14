document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/admin/view_admins');
        const admins = await response.json();
        
        const tableBody = document.getElementById('adminTableBody');
        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.name}</td>
                <td>${admin.mobile}</td>
                <td>${admin.email}</td>
                <td>${admin.primeStatus ? 'Yes' : 'No'}</td>
                <td>
                    <button onclick="editAdmin('${admin._id}')">Edit</button>
                    <button onclick="deleteAdmin('${admin._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
    }
});

function editAdmin(adminId) {
    // Implement your edit logic here
    alert(`Edit admin with ID: ${adminId}`);
}

function deleteAdmin(adminId) {
    // Implement your delete logic here
    alert(`Delete admin with ID: ${adminId}`);
}
