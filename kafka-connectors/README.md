### Useful Links

- [Kafka Control Center](http://localhost:9021/)
- [Mongo Express](http://localhost:8085/)

### How to Use

## Create and Populate the MySQL Database

Step 1: Access MySQL and Select the Database

mysql -u root -p  # Enter your password when prompted
USE kafkadb;

Step 2: Create a Table

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255)
);

Step 3: Insert Sample Data

INSERT INTO categories (name) VALUES ('electronics'), ('cars'), ('instruments');

## Import Connector Configuration Files

Step 1: Access the Control Center Interface

Open your browser and go to: http://localhost:9021/clusters
Navigate to Connected Services > Connect > connect-default
Click on Upload connector config file

Step 2: Add the Connectors

Upload the configuration files:
mongodb.properties and mysql.properties

After these steps, the data inserted into MySQL will automatically replicate to MongoDB.
