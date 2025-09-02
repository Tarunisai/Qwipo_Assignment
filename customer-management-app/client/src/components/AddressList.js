import { useState, useEffect, useCallback } from "react";
import api from "../api/axios"; 

function AddressList({ customerId, onAddressesChanged }) {
  const [addresses, setAddresses] = useState([]);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get(`/customers/${customerId}/addresses`);
      setAddresses(res.data.data || []);
      if (onAddressesChanged) onAddressesChanged();
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  }, [customerId, onAddressesChanged]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleDelete = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${addressId}`);
      fetchAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
      alert("Could not delete address. See server logs.");
    }
  };

  return (
    <div>
      <ul>
        {addresses.map(a => (
          <li key={a.id} style={{ marginBottom: 6 }}>
            {a.address_details}, {a.city}, {a.state} - {a.pin_code}
            <button onClick={() => handleDelete(a.id)} style={{ marginLeft: 8 }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddressList;
