document.getElementById('save-btn').addEventListener('click', async () => {
  const income = document.getElementById('income').value;
  const outcome = document.getElementById('outcome').value;
  const email = localStorage.getItem('email'); 
  const inputs = document.querySelectorAll('input');

  inputs.forEach((input, index) => {
      input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
              event.preventDefault(); 
              if (inputs[index + 1]) {
                  inputs[index + 1].focus();
              }
          }
      });
  });
  if (!income || !outcome) {
      alert("Please enter values for both income and outcome.");
      return;
  }

  if (!email) {
      alert("No email found in localStorage. Please log in again.");
      return;
  }

  try {
      const response = await fetch('/api/save-finance', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
              email: email,
              income: Number(income), 
              outcome: Number(outcome) 
          })
      });

      const result = await response.json();
      alert(result.message);

      document.getElementById('income').value = '';
      document.getElementById('outcome').value = '';
      window.open("./Dashboard.html", "_self");
  } catch (error) {
      console.error('Error:', error);
      alert("An error occurred while saving the finance data.");
  }
});
