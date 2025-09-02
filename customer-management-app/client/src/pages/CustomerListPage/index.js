import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import api from "../../api/axios";

function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/customers", {
          params: { search: searchQuery, sortField, sortOrder, page },
        });
        const data = res.data.data || [];
        if (page === 1) {
          setCustomers(data);
        } else {
          setCustomers((prev) => [...prev, ...data]);
        }
        setHasMore(data.length > 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [searchQuery, sortField, sortOrder, page]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSortField("id");
    setSortOrder("asc");
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  if (loading && page === 1) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Customer Dashboard</h2>
      <Link to="/add-customer">
        <button>Add New Customer</button>
      </Link>

      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by Name, City, State, or PIN"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={handleClearFilters}>Clear Filters</button>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="id">ID</option>
          <option value="first_name">Name</option>
          <option value="phone_number">Phone</option>
          <option value="addresses_count">Addresses</option>
        </select>

        <button
          onClick={() =>
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
          }
        >
          Sort {sortOrder === "asc" ? "⬆" : "⬇"}
        </button>
      </div>


      <InfiniteScroll
        dataLength={customers.length}
        next={() => setPage((prev) => prev + 1)}
        hasMore={hasMore}
        loader={<h4>Loading more...</h4>}
        height={600}
        endMessage={<p style={{ textAlign: "center" }}>No more customers</p>}
      >
        <table border="1" cellPadding="5" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Addresses</th>
              <th>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {customers.map((c) => {
              const matchesId = searchQuery && c.id.toString().includes(searchQuery);

              return (
                <tr key={c.id}>
                  <td
                    style={{
                      backgroundColor: matchesId ? "yellow" : "transparent",
                      fontWeight: matchesId ? "bold" : "normal",
                    }}
                  >
                    {c.id}
                  </td>
                  <td>{c.first_name} {c.last_name}</td>
                  <td>{c.phone_number}</td>
                  <td>{c.addresses_count}</td>
                  <td>
                    <Link to={`/edit-customer/${c.id}`}><button>Edit</button></Link>
                    <Link to={`/customers/${c.id}`}><button>View</button></Link>
                  </td>
                  <td>
                    <Link to={`/edit-customer/${c.id}`}>
                        <button>Edit</button>
                    </Link>
                    <Link to={`/customers/${c.id}`}>
                        <button>View</button>
                    </Link>
                    <button
                        onClick={async () => {
                        if (!window.confirm("Are you sure you want to delete this customer?")) return;
                        try {
                            await api.delete(`/customers/${c.id}`);
                            setCustomers(prev => prev.filter(cust => cust.id !== c.id));
                            alert("Customer deleted successfully!");
                        } catch (err) {
                            console.error("Failed to delete customer:", err);
                            alert("Error deleting customer");
                        }
                        }}
                        style={{ marginLeft: "10px", color: "red" }}
                    >
                        Delete
                    </button>
                    </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </InfiniteScroll>
    </div>
  );
}

export default CustomerListPage;
