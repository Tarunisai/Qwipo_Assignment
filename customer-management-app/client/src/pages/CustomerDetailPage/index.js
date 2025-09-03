import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddressForm from "../../components/AddressForm";
import AddressList from "../../components/AddressList";
import api from "../../api/axios";

function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Could not load customer details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer, refreshFlag]);

  const handleAddressAdded = () => {
    setRefreshFlag(prev => !prev); // trigger re-fetch
  };

  if (loading) return <p>Loading customer details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Customer Details</h2>
      {customer && (
        <>
          <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
          <p><strong>Phone:</strong> {customer.phone_number}</p>
          <p><strong>Addresses Count:</strong> {customer.addresses_count}</p>
          {customer.only_one_address && <p>(Only one address)</p>}

          <button
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this customer?")) return;
              try {
                await api.delete(`/customers/${id}`);
                alert("Customer deleted successfully!");
                navigate("/"); // redirect to dashboard
              } catch (err) {
                console.error("Failed to delete:", err);
                alert("Error deleting customer");
              }
            }}
            style={{ marginTop: "10px", color: "red" }}
          >
            Delete Customer
          </button>
        </>
      )}

      <section style={{ marginTop: 20 }}>
        <h3>Add Address</h3>
        <AddressForm customerId={id} onAddressAdded={handleAddressAdded} />
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Address List</h3>
        <AddressList key={refreshFlag} customerId={id} />
      </section>
    </div>
  );
}

export default CustomerDetailPage;
