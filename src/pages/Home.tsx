function Home() {
  return (
    <div className="card">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={"/vite.svg"} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={"/react.svg"} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default Home;
