import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// Custom metrics
const successfulRegistrations = new Counter("successful_registrations");
const failedRegistrations = new Counter("failed_registrations");

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "1m", target: 100 }, // Ramp up to 100 users
    { duration: "2m", target: 100 }, // Stay at 100 users
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2s
    http_req_failed: ["rate<0.1"], // Error rate should be less than 10%
  },
};

// Generate random Thai first names
const thaiFirstNames = [
  "สมชาย",
  "สมหญิง",
  "วิชัย",
  "สุดา",
  "ประเสริฐ",
  "นิภา",
  "สมศักดิ์",
  "วรรณา",
  "ชัยยา",
  "อรุณ",
  "มานะ",
  "สุภา",
  "วีระ",
  "นิตยา",
  "พิชัย",
  "สมบัติ",
  "วิไล",
  "ชาญชัย",
  "สุนีย์",
  "ธนา",
];

// Generate random Thai last names
const thaiLastNames = [
  "ใจดี",
  "สุขสม",
  "มั่งมี",
  "เจริญ",
  "ทองดี",
  "สว่าง",
  "รุ่งเรือง",
  "พัฒนา",
  "วิจิตร",
  "สมบูรณ์",
  "ศรีสุข",
  "บุญมี",
  "เกษม",
  "สุวรรณ",
  "ประสิทธิ์",
  "วัฒนา",
  "ชัยชนะ",
  "อุดม",
  "สงบ",
  "สุขใจ",
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmployeeId() {
  // Generate a unique 6-digit employee ID using timestamp and random number
  const timestamp = Date.now().toString().slice(-4);
  const random = String(Math.floor(10 + Math.random() * 90));
  return timestamp + random;
}

export default function () {
  const url = "http://localhost:3000/api/registrations/create";

  const payload = JSON.stringify({
    firstName: randomElement(thaiFirstNames),
    lastName: randomElement(thaiLastNames),
    employeeId: generateEmployeeId(),
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response has id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    successfulRegistrations.add(1);
  } else {
    failedRegistrations.add(1);
    console.log(`Failed registration: ${res.status} - ${res.body}`);
  }

  sleep(1); // Wait 1 second between requests
}
