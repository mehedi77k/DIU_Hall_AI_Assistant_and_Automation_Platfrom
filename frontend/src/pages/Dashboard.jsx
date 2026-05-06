export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p className="page-lead">
        Welcome to the DIU Hall AI Assistant and Automation Platform starter project.
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Gate Pass System</h3>
          <p>Students will request leave or item-out permissions from this module.</p>
        </div>

        <div className="card">
          <h3>Notice Board</h3>
          <p>Administration can publish important hall notices with deadlines.</p>
        </div>

        <div className="card">
          <h3>Complaint Box</h3>
          <p>Students can submit complaints and administration can track action status.</p>
        </div>

        <div className="card">
          <h3>Hall Rules Chatbot</h3>
          <p>Students will ask hall rules and code of conduct questions here.</p>
        </div>
      </div>
    </div>
  )
}



