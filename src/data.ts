export interface Topic {
  id: string;
  title: string;
  category: string;
  seniorSignal: string;
  code: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  taskPrompt: string;
  hints: string[];
}

export const studyGuideData: Topic[] = [
  {
    id: "db-read-write",
    title: "Database Read/Write & Querying",
    category: "Core I/O & Connectivity",
    seniorSignal: "Never use f-strings for SQL (SQL injection risk). Always use context managers (`with`) so connections close even if errors occur. Note: Using `sqlite3` here for standard-library simplicity, but the pattern applies exactly to `psycopg2` or `pymysql`.",
    code: `import sqlite3
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def setup_db(db_path: str = ":memory:") -> sqlite3.Connection:
    """Returns a connection. In production, use connection pooling."""
    return sqlite3.connect(db_path)

def write_to_db(conn: sqlite3.Connection, data: List[Tuple[str, int]]):
    """Writes data using parameterized queries to prevent SQL injection."""
    insert_query = "INSERT INTO users (name, age) VALUES (?, ?)"
    
    with conn: # Context manager automatically commits or rolls back
        cursor = conn.cursor()
        # Create table for demo purposes
        cursor.execute("CREATE TABLE IF NOT EXISTS users (name TEXT, age INTEGER)")
        # execute_many is highly optimized for bulk inserts
        cursor.executemany(insert_query, data)
        logger.info(f"Inserted {len(data)} rows.")

def read_from_db(conn: sqlite3.Connection, min_age: int) -> List[Tuple]:
    """Reads data using parameters."""
    select_query = "SELECT name, age FROM users WHERE age >= ?"
    
    with conn:
        cursor = conn.cursor()
        cursor.execute(select_query, (min_age,))
        return cursor.fetchall()`,
    difficulty: "Easy",
    taskPrompt: "Write a Python snippet that queries a PostgreSQL/SQLite database to find users older than a given age. Ensure the query is secure against SQL injection.",
    hints: ["Use a standard DBAPI driver (like psycopg2 or sqlite3).","Always use parameterized queries (e.g., ? or %s) rather than f-strings.","Use the connection as a context manager (with statement) to ensure it closes properly."]
  },
  {
    id: "api-pulling",
    title: "Pulling Data via API",
    category: "Core I/O & Connectivity",
    seniorSignal: "Networks fail. Show you know how to use exponential backoff, handle timeouts, and manage custom exceptions.",
    code: `import requests
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

class APITimeoutError(Exception):
    """Custom exception for API timeouts."""
    pass

# Retry 3 times, waiting 2s, then 4s, then 8s between retries
@retry(
    wait=wait_exponential(multiplier=2, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(APITimeoutError)
)
def fetch_data_from_api(url: str, timeout_sec: int = 5) -> dict:
    """Fetches data with timeout and automatic retries."""
    try:
        response = requests.get(url, timeout=timeout_sec)
        response.raise_for_status() # Raises HTTPError for bad responses (4xx, 5xx)
        return response.json()
    except requests.exceptions.Timeout as e:
        raise APITimeoutError(f"API timed out: {e}")
    except requests.exceptions.RequestException as e:
        # Fatal error, do not retry
        raise RuntimeError(f"Fatal API error: {e}")`,
    difficulty: "Medium",
    taskPrompt: "Implement a function that fetches data from an API endpoint. It must retry up to 3 times for transient errors (like timeouts) using exponential backoff, but fail immediately on fatal errors.",
    hints: ["The 'tenacity' library is perfect for abstracting retry logic.","Use @retry(wait=wait_exponential(...), stop=stop_after_attempt(3)).","Catch specific timeout exceptions for retries and generic RequestExceptions for fatal errors."]
  },
  {
    id: "s3-load-write",
    title: "Loading & Writing S3 Data",
    category: "Core I/O & Connectivity",
    seniorSignal: "Knowing how to read multiple formats and writing with Hive-style partitioning (dt=YYYY-MM-DD). (Requires pandas, boto3, pyarrow or fastparquet)",
    code: `import pandas as pd
import boto3
import io

def load_s3_file(bucket: str, key: str, file_type: str = "csv") -> pd.DataFrame:
    """Loads a file from S3 into a pandas DataFrame."""
    s3_client = boto3.client('s3')
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    
    if file_type == "csv":
        return pd.read_csv(obj['Body'])
    elif file_type == "parquet":
        # io.BytesIO reads the byte stream into memory for pandas
        return pd.read_parquet(io.BytesIO(obj['Body'].read()))
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def write_parquet_to_s3(df: pd.DataFrame, s3_path: str):
    """
    Writes DataFrame to S3 as Parquet, partitioned by a date column.
    Produces folder structure: s3://my-bucket/data/dt=2023-01-01/part.parquet
    """
    # s3_path example: "s3://my-bucket/processed_data/"
    df.to_parquet(
        s3_path,
        engine='pyarrow',
        compression='snappy',
        partition_cols=['dt'], # Hive-style partitioning
        index=False
    )`,
    difficulty: "Medium",
    taskPrompt: "Using pandas and awswrangler (or boto3 + pandas), write a DataFrame as a Parquet file to an S3 bucket. Partition the data by a 'dt' (date) column and apply Snappy compression.",
    hints: ["awswrangler (wr) provides a clean Pandas-to-AWS interface (e.g., wr.s3.to_parquet).","If using pandas directly, construct the S3 URI and use df.to_parquet().","Pass the partition_cols=['dt'] and compression='snappy' arguments."]
  },
  {
    id: "logging-config",
    title: "Logging & Configuration",
    category: "Core I/O & Connectivity",
    seniorSignal: "No print() statements. Configure logging with correlation IDs and use environment variables for secrets.",
    code: `import logging
import json
import os
from uuid import uuid4

class JSONFormatter(logging.Formatter):
    """Custom formatter to output logs as JSON."""
    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "correlation_id": getattr(record, 'correlation_id', 'N/A')
        }
        return json.dumps(log_record)

def setup_logger():
    logger = logging.getLogger("data_pipeline")
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    return logger

# Usage
logger = setup_logger()
db_password = os.getenv("DB_PASSWORD") # Never hardcode secrets!

# Inject a correlation ID for tracing a specific pipeline run
run_id = str(uuid4())
logger.info("Pipeline started", extra={"correlation_id": run_id})`,
    difficulty: "Easy",
    taskPrompt: "Configure the standard Python logging module to emit JSON formatted logs. Include a unique 'correlation_id' in the log output for distributed tracing.",
    hints: ["The 'pythonjsonlogger' library allows easy JSON formatting.","Create a StreamHandler and apply the JsonFormatter to it.","Pass extra={'correlation_id': run_id} into your logger calls."]
  },
  {
    id: "dataframe-wrangling",
    title: "DataFrame Wrangling",
    category: "Data Manipulation & Concurrency",
    seniorSignal: "Method chaining for readability, handling edge cases (nulls), and basic analytic functions.",
    code: `import pandas as pd

def transform_data(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans, fills missing data, and aggregates."""
    
    # 1. Fill missing data
    # Fill numeric nulls with 0, string nulls with 'UNKNOWN'
    df['amount'] = df['amount'].fillna(0.0)
    df['category'] = df['category'].fillna('UNKNOWN')
    
    # 2. Filter out bad records (e.g., negative amounts)
    df_clean = df[df['amount'] >= 0].copy()
    
    # 3. Aggregation & Window Function equivalent
    # Get total amount per category
    agg_df = df_clean.groupby('category', as_index=False).agg(
        total_amount=('amount', 'sum'),
        transaction_count=('amount', 'count')
    )
    
    # 4. Rank categories by total amount (like SQL ROW_NUMBER() or RANK())
    agg_df['rank'] = agg_df['total_amount'].rank(method='dense', ascending=False)
    
    return agg_df.sort_values('rank')`,
    difficulty: "Medium",
    taskPrompt: "Given a Pandas DataFrame of transactions, group the data by 'user_id', calculate their total spend, filter out users who spent less than 100, and rank the rest in descending order using dense ranking.",
    hints: ["Use groupby('user_id') and agg(total_amount=('amount', 'sum')).","Filter using a boolean mask: df[df['total_amount'] >= 100].","Use .rank(method='dense', ascending=False) to generate the rank column."]
  },
  {
    id: "concurrency",
    title: "Concurrency for I/O Bound Work",
    category: "Data Manipulation & Concurrency",
    seniorSignal: "Using ThreadPoolExecutor to speed up API calls or S3 reads.",
    code: `import concurrent.futures
import requests
from typing import List

def fetch_single(url: str) -> dict:
    return requests.get(url, timeout=5).json()

def fetch_urls_concurrently(urls: List[str], max_workers: int = 5) -> List[dict]:
    """Fetches multiple URLs in parallel using thread pooling."""
    results = []
    # Use ThreadPoolExecutor for I/O bound tasks (API/DB calls)
    # Use ProcessPoolExecutor for CPU bound tasks (heavy math)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Map applies the function to the iterable concurrently
        for result in executor.map(fetch_single, urls):
            results.append(result)
            
    return results`,
    difficulty: "Hard",
    taskPrompt: "Write a function that downloads data from a list of URLs concurrently using a ThreadPool. Ensure no more than 5 threads are active at once.",
    hints: ["Import ThreadPoolExecutor from concurrent.futures.","Instantiate it with max_workers=5.","Use executor.map() or a list comprehension with executor.submit() to process the list."]
  },
  {
    id: "oop-structure",
    title: "OOP Structure",
    category: "Advanced Python & Architecture",
    seniorSignal: "Designing for extension. If they ask 'what if we add a new source?', you point to this pattern.",
    code: `from abc import ABC, abstractmethod
import pandas as pd

# Abstract Base Class
class DataLoader(ABC):
    @abstractmethod
    def load(self, path: str) -> pd.DataFrame:
        pass

# Concrete implementations
class CSVLoader(DataLoader):
    def load(self, path: str) -> pd.DataFrame:
        return pd.read_csv(path)

class ParquetLoader(DataLoader):
    def load(self, path: str) -> pd.DataFrame:
        return pd.read_parquet(path)

# Factory to choose at runtime
def get_loader(file_type: str) -> DataLoader:
    loaders = {
        "csv": CSVLoader(),
        "parquet": ParquetLoader()
    }
    if file_type not in loaders:
        raise ValueError("Unsupported format")
    return loaders[file_type]

# Usage
# df = get_loader("parquet").load("data.parquet")`,
    difficulty: "Hard",
    taskPrompt: "Implement the Factory Design Pattern to dynamically instantiate different FileLoader objects (e.g., CSVLoader, ParquetLoader) based on a provided file extension.",
    hints: ["Create an abstract base class or simply define common methods for the loaders.","Define concrete classes for CSV and Parquet.","Write a get_loader() function that maps the file extension string to the correct class instance."]
  },
  {
    id: "generators-decorators",
    title: "Generators & Decorators",
    category: "Advanced Python & Architecture",
    seniorSignal: "Use generators for memory-safe processing (streaming large files). Use decorators for cross-cutting concerns like timing.",
    code: `import time
from typing import Generator

# Timing Decorator
def timeit(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

# Generator for streaming large files
@timeit
def process_large_file_in_chunks(filepath: str, chunk_size: int = 1000) -> Generator[list, None, None]:
    """Yields rows in chunks so we don't load a massive file into memory at once."""
    chunk = []
    with open(filepath, 'r') as file:
        for line in file:
            chunk.append(line.strip())
            if len(chunk) == chunk_size:
                yield chunk
                chunk = []
        if chunk: # Yield remaining lines
            yield chunk

# Usage:
# for chunk in process_large_file_in_chunks("huge_data.txt"):
#     write_to_db(chunk)`,
    difficulty: "Hard",
    taskPrompt: "Write a memory-efficient generator function that reads a large file in small chunks (e.g., 1024 bytes) yielding each chunk until the file is fully read.",
    hints: ["Use the 'yield' keyword to make the function a generator.","Open the file in binary mode ('rb') and use a while True loop.","Break the loop if the chunk read is empty."]
  },
  {
    id: "pytest-mocking",
    title: "Pytest, Mocking APIs, and Faking S3",
    category: "Testing & Mocking",
    seniorSignal: "Production code is testable code. Show how to mock external dependencies using unittest.mock and moto.",
    code: `import pytest
import boto3
from unittest.mock import patch
from moto import mock_aws # Or mock_s3 in older moto versions

# 1. Mocking an API call
@patch('requests.get')
def test_fetch_data_from_api(mock_get):
    # Setup the mock response
    mock_get.return_value.json.return_value = {"status": "success"}
    mock_get.return_value.status_code = 200
    
    # Assuming fetch_data_from_api is imported
    result = fetch_data_from_api("http://fake-url.com")
    
    assert result["status"] == "success"
    mock_get.assert_called_once_with("http://fake-url.com", timeout=5)

# 2. Mocking S3 with Moto
@mock_aws
def test_s3_upload():
    # Setup mock AWS environment
    s3 = boto3.client('s3', region_name='us-east-1')
    s3.create_bucket(Bucket='test-bucket')
    
    # Do the operation
    s3.put_object(Bucket='test-bucket', Key='data.txt', Body=b'hello world')
    
    # Assert successful operation
    response = s3.get_object(Bucket='test-bucket', Key='data.txt')
    assert response['Body'].read() == b'hello world'`,
    difficulty: "Medium",
    taskPrompt: "Write a test function using pytest and the 'moto' library to verify that a file is successfully uploaded to an mock S3 bucket without making actual network requests.",
    hints: ["Use the @mock_s3 decorator from the moto library.","Initialize a boto3 client inside the test and create the mock bucket first.","Upload the file, then retrieve it and assert its contents match."]
  },
  {
    id: "airflow-taskflow",
    title: "Modern Airflow (TaskFlow API) & XComs",
    category: "Orchestration (Apache Airflow)",
    seniorSignal: "Using Airflow 2.0+ @dag and @task decorators instead of the clunky, traditional PythonOperator. Crucial talking point: Never pass large data (like Pandas DataFrames) between tasks. Pass the S3/file path (metadata) via XCom, and let the next task read the data from that path.",
    code: `from airflow.decorators import dag, task
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Standardize error handling and retries at the DAG level
default_args = {
    'owner': 'data_eng',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'email_on_failure': False,
}

@dag(
    dag_id='api_to_db_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    start_date=datetime(2023, 1, 1),
    catchup=False, # Senior signal: Prevents accidental backfilling of thousands of runs
    tags=['ingestion', 'fintech']
)
def api_ingestion_dag():

    @task(multiple_outputs=True)
    def extract_data() -> dict:
        """
        Extracts data and saves it to cloud storage.
        Returns metadata (paths/counts) to be passed via XCom.
        """
        logger.info("Extracting data from API...")
        # Imagine requests.get() logic here
        
        saved_s3_path = "s3://landing-bucket/raw/data.json"
        record_count = 1500
        
        # Returning a dict in a TaskFlow task automatically pushes to XCom
        return {"file_path": saved_s3_path, "count": record_count}

    @task
    def transform_and_load(metadata: dict):
        """
        Reads the metadata from XCom, downloads the data, and processes it.
        """
        file_path = metadata["file_path"]
        logger.info(f"Reading data from {file_path} with {metadata['count']} records")
        
        # Imagine pd.read_json(file_path) and DB insert logic here
        logger.info("Data transformed and loaded successfully.")

    # Define dependencies seamlessly using Python function calls
    # TaskFlow automatically handles the bitshift (>>) logic under the hood
    extraction_metadata = extract_data()
    transform_and_load(extraction_metadata)

# Instantiate the DAG
dag_instance = api_ingestion_dag()`,
    difficulty: "Medium",
    taskPrompt: "Define an Airflow DAG using the TaskFlow API (@dag and @task) containing three steps: extract, transform, and load. Pass the output of extract to transform, and transform to load.",
    hints: ["Decorate the main function with @dag.","Decorate the individual step functions with @task.","Call the functions sequentially, assigning the result of one to a variable and passing it to the next."]
  },
  {
    id: "airflow-jinja",
    title: "Idempotency & Jinja Templating",
    category: "Orchestration (Apache Airflow)",
    seniorSignal: "A pipeline must be safely re-runnable for any past date without duplicating data. Show you know how to use Airflow's Jinja templating (like {{ ds }} for the logical date) to partition data writes.",
    code: `from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime

def _process_partition(execution_date: str, **kwargs):
    """
    Uses the Airflow logical execution date to read/write specific partitions.
    If the DAG runs for '2023-10-05', it only touches that folder.
    """
    input_path = f"s3://raw-data/dt={execution_date}/"
    output_path = f"s3://processed-data/dt={execution_date}/"
    
    print(f"Reading from {input_path}")
    print(f"Overwriting/Upserting to {output_path} to ensure idempotency")

with DAG(
    dag_id='idempotent_partition_dag',
    schedule_interval='@daily',
    start_date=datetime(2023, 1, 1),
    catchup=False
) as dag:

    start_task = EmptyOperator(task_id='start')

    # Provide context=True (or pass kwargs in modern Airflow) to access Airflow variables
    process_task = PythonOperator(
        task_id='process_daily_partition',
        python_callable=_process_partition,
        # Senior Signal: Passing Airflow macros via op_kwargs keeps functions pure/testable
        op_kwargs={'execution_date': '{{ ds }}'} 
    )

    end_task = EmptyOperator(task_id='end')

    # Traditional Bitshift Dependencies
    start_task >> process_task >> end_task`,
    difficulty: "Hard",
    taskPrompt: "Define an Airflow BashOperator task that prints the logical execution date of the DAG run using a Jinja template.",
    hints: ["Import BashOperator from airflow.operators.bash.","In the bash_command argument, use 'echo {{ ds }}'.","Airflow automatically resolves the {{ ds }} macro at runtime."]
  }
];

export const tipsData = [
  {
    title: "Whiteboarding",
    description: "If doing this in an IDE like CoderPad, don't rush to code. Write comments outlining the steps first (e.g., `# 1. Fetch from API`, `# 2. Validate schema`, `# 3. Load to DB`)."
  },
  {
    title: "What happens if it fails?",
    description: "Whenever you write an API call or DB write, proactively mention: 'In production, I\\'d wrap this in a retry block and log the failure to a dead-letter queue (DLQ).'"
  },
  {
    title: "Idempotency",
    description: "When writing to databases or S3, explicitly state: 'I\\'m using INSERT ... ON CONFLICT (upsert) or overwriting a specific S3 partition so that if this script runs twice, it doesn\\'t double-count data.'"
  },
  {
    title: "How do you test this?",
    description: "'I separate my Python logic from my Airflow logic. The Python functions (data extraction, Pandas transformations) live in a separate module and are tested with pytest. The DAG file is just configuration, tested using DagBag to ensure there are no cyclic dependencies and that task counts are correct.'"
  },
  {
    title: "Backfilling & catchup",
    description: "Be prepared to explain what happens if an Airflow DAG gets paused for a week and then turned back on. Mention that setting catchup=True will run the missed executions sequentially, which is why designing tasks around the logical execution date ({{ ds }}) is vital."
  },
  {
    title: "Handling Failures",
    description: "Point out Airflow's native retry mechanisms (retries: 3, retry_delay: timedelta(minutes=5)). Mention that because your tasks are designed to be idempotent (overwriting partitions or using UPSERT in SQL), a retry won't cause duplicate data."
  }
];
