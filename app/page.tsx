export default function Home() {
  return (
    <div>
      <h1>RentalHub API</h1>
      <p>This server exposes REST endpoints under <code>/api</code>.</p>
      <ul>
        <li><code>/api/auth/register</code>, <code>/api/auth/login</code>, <code>/api/auth/me</code></li>
        <li><code>/api/equipment</code></li>
        <li><code>/api/rentals</code></li>
        <li><code>/api/users</code></li>
        <li><code>/api/dashboard</code></li>
      </ul>
    </div>
  );
}
