import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import AddressForm from "../../components/AddressForm";
import AddressList from "../../components/AddressList";
import api from "../../api/axios";

function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Could not load customer details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer, refreshFlag]);

  const handleAddressAdded = () => setRefreshFlag(prev => !prev);

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
