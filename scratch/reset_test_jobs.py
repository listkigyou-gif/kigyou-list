import sqlite3

DB_PATH = 'crawlers/hellowork/data/hellowork.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Reset test jobs to pending with retry_count = 0
test_jobs = ['0909003605261', '1105009589461']
cursor.execute("UPDATE jobs_queue SET status='pending', retry_count=0 WHERE job_id IN (?, ?)", test_jobs)
conn.commit()

# Print status to verify
cursor.execute("SELECT job_id, status, retry_count FROM jobs_queue WHERE job_id IN (?, ?)", test_jobs)
print("Updated jobs:", cursor.fetchall())

conn.close()
