import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function CustomerFormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address_details: "",
    city: "",
    state: "",
    pin_code: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create customer
      const customerRes = await api.post("/customers", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number
      });

      const newCustomerId = customerRes.data.data.id;

      // Step 2: Create address for this customer
      await api.post(`/customers/${newCustomerId}/addresses`, {
        address_details: formData.address_details,
        city: formData.city,
        state: formData.state,
        pin_code: formData.pin_code
      });

      alert("Customer and address added successfully!");
      navigate("/"); // go back to dashboard
    } catch (err) {
      console.error("Server error:", err);
      setError(err.response?.data?.message || "Failed to submit data. See server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add New Customer with Address</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "300px"
        }}
      >
        <input
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <input
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
        <input
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          required
        />
        <input
          name="address_details"
          placeholder="Address"
          value={formData.address_details}
          onChange={handleChange}
          required
        />
        <input
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          required
        />
        <input
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          required
        />
        <input
          name="pin_code"
          placeholder="Pin Code"
          value={formData.pin_code}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Add Customer"}
        </button>
      </form>
    </div>
  );
}

export default CustomerFormPage;
