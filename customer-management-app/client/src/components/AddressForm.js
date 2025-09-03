import { useState } from "react";
import api from "../api/axios";

function AddressForm({ customerId, onAddressAdded }) {
  const [formData, setFormData] = useState({
    address_details: "",
    city: "",
    state: "",
    pin_code: ""
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${customerId}/addresses`, formData);
      alert("Address added successfully!");
      setFormData({ address_details: "", city: "", state: "", pin_code: "" });
      if (onAddressAdded) onAddressAdded();
    } catch (err) {
      console.error("Failed to add address:", err);
      alert("Could not add address. See server logs.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px" }}>
      <input name="address_details" placeholder="Address" value={formData.address_details} onChange={handleChange} required />
      <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required />
      <input name="state" placeholder="State" value={formData.state} onChange={handleChange} required />
      <input name="pin_code" placeholder="Pin Code" value={formData.pin_code} onChange={handleChange} required />
      <button type="submit">Add Address</button>
    </form>
  );
}

export default AddressForm;
