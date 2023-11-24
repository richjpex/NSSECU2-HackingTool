# rethinkdb-enumerate.py
Advanced and Offensive Security (NSSECU2) Hacking Tool Project Repository of Group 5 of S11

### What does this tool do?
This Python script is designed to enumerate RethinkDB instances by checking if port 28015 is open and attempting to brute-force the password for the 'admin' user. The tool uses the Nmap library for port scanning and the RethinkDB library for connecting to the database and retrieving information.

### Prerequisites
Before using the rethinkdb-enumerate tool, ensure that you have the following prerequisites installed:
- Python 3.x
- Nmap library (python-nmap)
- RethinkDB library (rethinkdb)

### Functionality
The program performs the following steps:

- **Port Check:** Checks if port 28015 (default RethinkDB port) is open on the specified target.

- **User Confirmation:** If the port is open, the user is prompted to confirm whether they want to proceed with enumeration.

- **Wordlist Path:** The user is prompted to enter the path to a custom wordlist. If no input is provided, the default wordlist (rockyou.txt) is used.

- **Brute Force:** Attempts to brute-force the password for the 'admin' user using the provided or default wordlist.

- **Database Enumeration:** If the password is found, the tool logs in and retrieves a list of databases, and tables

- **(Bonus) User Enumeration:** If there is a ‘users’ table in the database, it extracts the possible credentials (username and passwords) and includes it in the enumeration.

### **Disclaimer**
This tool is provided for educational and ethical purposes only. The authors are not responsible for any misuse or damage caused by the tool. Use it responsibly and in compliance with applicable laws and regulations.

### How to run the program
1. Install the requirements
``pip install -r requirements.txt``
2. Run the program
``python rethinkdb-enumerate.py <target IP address>``
