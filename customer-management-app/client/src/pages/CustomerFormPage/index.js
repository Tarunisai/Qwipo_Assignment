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
      if (id) {
        // edit customer
        await api.put(`/customers/${id}`, formData);
        alert("Customer updated successfully!");
      } else {
        // create new customer
        await api.post("/customers", formData);
        alert("Customer added successfully!");
      }
      navigate("/"); // redirect to dashboard (CustomerListPage)
    } catch (err) {
      console.error("Server error:", err);
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to submit data. See server logs.");
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
          {loading ? "Submitting..." : id ? "Update Customer" : "Add Customer"}
        </button>
      </form>
    </div>
  );
}

export default CustomerFormPage;
