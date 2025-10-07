window.onload = () => {
  showGP();

  document.getElementById("draw").onclick = () => {
    let gp = parseInt(localStorage.getItem("gp"));
    if (gp >= 10) {
      addGP(-10);
      document.getElementById("result").textContent = "✨ Acommon1 を入手！";
    } else {
      document.getElementById("result").textContent = "GPが足りません！";
    }
  };

  document.getElementById("back").onclick = () => location.href = "index.html";
};
