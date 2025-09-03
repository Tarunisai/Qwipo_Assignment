import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import "./index.css";

function CustomerFormPage() {
  const { id } = useParams(); 
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

  // Fetch customer data if editing
  useEffect(() => {
    if (!id) return; 
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        const data = res.data.data;
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone_number: data.phone_number || "",
          address_details: data.address_details || "",
          city: data.city || "",
          state: data.state || "",
          pin_code: data.pin_code || ""
        });
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        setError("Could not load customer data.");
      }
    };
    fetchCustomer();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let customerId = id; // Use existing id if editing
      if (!id) {
        // Create new customer
        const res = await api.post("/customers", {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number
        });

        // Extract the ID safely
        customerId = res.data?.data?.id || res.data?.customer?.id;
        if (!customerId) throw new Error("New customer ID not returned by backend");

        // Add first address if filled
        if (formData.address_details) {
          await api.post(`/customers/${customerId}/addresses`, {
            address_details: formData.address_details,
            city: formData.city,
            state: formData.state,
            pin_code: formData.pin_code
          });
        }

        alert("Customer added successfully!");
      } else {
        // Edit existing customer
        await api.put(`/customers/${customerId}`, formData);

        // Optionally, update first address if editing page has it
        if (formData.address_details) {
          await api.post(`/customers/${customerId}/addresses`, {
            address_details: formData.address_details,
            city: formData.city,
            state: formData.state,
            pin_code: formData.pin_code
          });
        }

        alert("Customer updated successfully!");
      }

      navigate("/"); // redirect to dashboard
    } catch (err) {
      console.error("Server error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Failed to submit data. See server logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{id ? "Edit Customer" : "Add New Customer"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} className="form-con">
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
        />
        <input
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
        />
        <input
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
        />
        <input
          name="pin_code"
          placeholder="Pin Code"
          value={formData.pin_code}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : id ? "Update Customer" : "Add Customer"}
        </button>
      </form>
    </div>
  );
}

export default CustomerFormPage;
