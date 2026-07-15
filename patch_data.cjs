const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf8');

// Update Interface
content = content.replace(
  "difficulty: 'Easy' | 'Medium' | 'Hard';",
  "difficulty: 'Easy' | 'Medium' | 'Hard';\n  taskPrompt: string;\n  hints: string[];"
);

const prompts = {
  "db-read-write": {
    prompt: "Write a Python snippet that queries a PostgreSQL/SQLite database to find users older than a given age. Ensure the query is secure against SQL injection.",
    hints: ["Use a standard DBAPI driver (like psycopg2 or sqlite3).", "Always use parameterized queries (e.g., ? or %s) rather than f-strings.", "Use the connection as a context manager (with statement) to ensure it closes properly."]
  },
  "api-pulling": {
    prompt: "Implement a function that fetches data from an API endpoint. It must retry up to 3 times for transient errors (like timeouts) using exponential backoff, but fail immediately on fatal errors.",
    hints: ["The 'tenacity' library is perfect for abstracting retry logic.", "Use @retry(wait=wait_exponential(...), stop=stop_after_attempt(3)).", "Catch specific timeout exceptions for retries and generic RequestExceptions for fatal errors."]
  },
  "s3-load-write": {
    prompt: "Using pandas and awswrangler (or boto3 + pandas), write a DataFrame as a Parquet file to an S3 bucket. Partition the data by a 'dt' (date) column and apply Snappy compression.",
    hints: ["awswrangler (wr) provides a clean Pandas-to-AWS interface (e.g., wr.s3.to_parquet).", "If using pandas directly, construct the S3 URI and use df.to_parquet().", "Pass the partition_cols=['dt'] and compression='snappy' arguments."]
  },
  "logging-config": {
    prompt: "Configure the standard Python logging module to emit JSON formatted logs. Include a unique 'correlation_id' in the log output for distributed tracing.",
    hints: ["The 'pythonjsonlogger' library allows easy JSON formatting.", "Create a StreamHandler and apply the JsonFormatter to it.", "Pass extra={'correlation_id': run_id} into your logger calls."]
  },
  "dataframe-wrangling": {
    prompt: "Given a Pandas DataFrame of transactions, group the data by 'user_id', calculate their total spend, filter out users who spent less than 100, and rank the rest in descending order using dense ranking.",
    hints: ["Use groupby('user_id') and agg(total_amount=('amount', 'sum')).", "Filter using a boolean mask: df[df['total_amount'] >= 100].", "Use .rank(method='dense', ascending=False) to generate the rank column."]
  },
  "concurrency": {
    prompt: "Write a function that downloads data from a list of URLs concurrently using a ThreadPool. Ensure no more than 5 threads are active at once.",
    hints: ["Import ThreadPoolExecutor from concurrent.futures.", "Instantiate it with max_workers=5.", "Use executor.map() or a list comprehension with executor.submit() to process the list."]
  },
  "oop-structure": {
    prompt: "Implement the Factory Design Pattern to dynamically instantiate different FileLoader objects (e.g., CSVLoader, ParquetLoader) based on a provided file extension.",
    hints: ["Create an abstract base class or simply define common methods for the loaders.", "Define concrete classes for CSV and Parquet.", "Write a get_loader() function that maps the file extension string to the correct class instance."]
  },
  "generators-decorators": {
    prompt: "Write a memory-efficient generator function that reads a large file in small chunks (e.g., 1024 bytes) yielding each chunk until the file is fully read.",
    hints: ["Use the 'yield' keyword to make the function a generator.", "Open the file in binary mode ('rb') and use a while True loop.", "Break the loop if the chunk read is empty."]
  },
  "pytest-mocking": {
    prompt: "Write a test function using pytest and the 'moto' library to verify that a file is successfully uploaded to an mock S3 bucket without making actual network requests.",
    hints: ["Use the @mock_s3 decorator from the moto library.", "Initialize a boto3 client inside the test and create the mock bucket first.", "Upload the file, then retrieve it and assert its contents match."]
  },
  "airflow-taskflow": {
    prompt: "Define an Airflow DAG using the TaskFlow API (@dag and @task) containing three steps: extract, transform, and load. Pass the output of extract to transform, and transform to load.",
    hints: ["Decorate the main function with @dag.", "Decorate the individual step functions with @task.", "Call the functions sequentially, assigning the result of one to a variable and passing it to the next."]
  },
  "airflow-jinja": {
    prompt: "Define an Airflow BashOperator task that prints the logical execution date of the DAG run using a Jinja template.",
    hints: ["Import BashOperator from airflow.operators.bash.", "In the bash_command argument, use 'echo {{ ds }}'.", "Airflow automatically resolves the {{ ds }} macro at runtime."]
  }
};

for (const id of Object.keys(prompts)) {
  const data = prompts[id];
  const regex = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?difficulty:\\s*"(Easy|Medium|Hard)")`, 'g');
  content = content.replace(regex, `$1,\n    taskPrompt: "${data.prompt}",\n    hints: ${JSON.stringify(data.hints)}`);
}

fs.writeFileSync('src/data.ts', content);
