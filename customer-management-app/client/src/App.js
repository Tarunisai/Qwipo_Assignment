import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerListPage from "./pages/CustomerListPage";
import CustomerFormPage from "./pages/CustomerFormPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerListPage />} />
        <Route path="/add-customer" element={<CustomerFormPage />} />
        <Route path="/edit-customer/:id" element={<CustomerFormPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
