let db;

// Creates new db request for budget database 
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    // Creates a store called pending and sets it as auto increment
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // Checks if app is online before reading from db 
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Not connected" + event.target.errorCode);
};

function saveRecord(record) {
    // Creates transaction on pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // Accesses pending object store 
    const store = transaction.objectStore("pending");

    // Adds record to store with add method 
    store.add(record);
};

function checkDatabase() {
    // Opens transaction on pending db
    const transaction = db.transaction(["pending"], "readwrite");

    // Accesses pending object store 
    const store = transaction.objectStore("pending");

    // Gets all records from store amd sets variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // If transaction successful, open on pending db 
                    const transaction = db.transaction(["pending"], "readwrite");

                    // Accesses pending object store
                    const store = transaction.objectStore("pending");

                    // Clears items in store
                    store.clear();
                });
        }
    };
}

// Listener for when app comes back online 
window.addEventListener("online", checkDatabase);