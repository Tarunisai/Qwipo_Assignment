import { Link } from "react-router-dom";
import { useState } from "react";

function CustomerList({ customers, onDelete }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    setLoadingId(id);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(id); 
      } else {
        console.error("Failed to delete customer");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <h2>Customers</h2>
      <ul>
        {customers.map((customer) => (
          <li key={customer.id} className="flex items-center gap-3">
            <Link to={`/customers/${customer.id}`}>
              {customer.first_name} {customer.last_name}
            </Link>
            <button
              onClick={() => handleDelete(customer.id)}
              disabled={loadingId === customer.id}
              style={{ marginLeft: "10px", color: "red" }}
            >
              {loadingId === customer.id ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomerList;
