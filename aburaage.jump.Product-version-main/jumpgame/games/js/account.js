window.onload = () => {
  showGP();

  document.getElementById("reset").onclick = () => {
    if (confirm("本当に初期化しますか？")) {
      localStorage.clear();
      location.reload();
    }
  };

  document.getElementById("back").onclick = () => location.href = "index.html";
};
