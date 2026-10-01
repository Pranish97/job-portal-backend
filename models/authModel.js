import pool from "../config/db.js";

// REGISTER USER
// Student or Employer
export const registerUserModel = async ({
  full_name,
  email,
  password,
  role_id,
  company_name,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // CHECK EXISTING EMAIL
    const [existing] = await connection.query(
      `
      SELECT user_id
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email],
    );

    if (existing.length) {
      throw new Error("Email is already registered.");
    }

    // CHECK ROLE
    // Only Student and Employer can register
    const [[role]] = await connection.query(
      `
      SELECT
        role_id,
        role_name
      FROM roles
      WHERE role_id = ?
        AND role_name IN ('Student', 'Employer')
      LIMIT 1
      `,
      [role_id],
    );

    if (!role) {
      throw new Error("Invalid role selected.");
    }

    // EMPLOYER MUST PROVIDE COMPANY NAME
    if (role.role_name === "Employer" && !company_name) {
      throw new Error("Company name is required.");
    }

    // CREATE USER
    const [result] = await connection.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password
      )
      VALUES (?, ?, ?)
      `,
      [full_name, email, password],
    );

    const user_id = result.insertId;

    // ASSIGN ROLE
    await connection.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id
      )
      VALUES (?, ?)
      `,
      [user_id, role.role_id],
    );

    // CREATE STUDENT PROFILE
    if (role.role_name === "Student") {
      await connection.query(
        `
        INSERT INTO student_profiles (
          user_id
        )
        VALUES (?)
        `,
        [user_id],
      );
    }

    // CREATE COMPANY
    if (role.role_name === "Employer") {
      await connection.query(
        `
        INSERT INTO companies (
          user_id,
          company_name
        )
        VALUES (?, ?)
        `,
        [user_id, company_name],
      );
    }

    await connection.commit();

    return {
      user_id,
      full_name,
      email,
      role: role.role_name,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// LOGIN
export const loginUserModel = async (email) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.password,
      u.last_login,

      r.role_name,

      c.company_id,
      c.company_name,
      c.logo_url AS company_logo_url,
      c.is_verified AS company_verified

    FROM users u

    INNER JOIN user_roles ur
      ON ur.user_id = u.user_id

    INNER JOIN roles r
      ON r.role_id = ur.role_id

    LEFT JOIN companies c
      ON c.user_id = u.user_id

    WHERE LOWER(u.email) = LOWER(?)

    LIMIT 1
    `,
    [email.trim().toLowerCase()],
  );

  if (!rows.length) {
    throw new Error("Invalid email or password.");
  }

  return rows[0];
};

// UPDATE LAST LOGIN
export const updateLastLoginModel = async (userId) => {
  await pool.query(
    `
    UPDATE users
    SET last_login = NOW()
    WHERE user_id = ?
    `,
    [userId],
  );
};

// ROLE DROPDOWN
export const getRoleDropdownModel = async () => {
  const [roles] = await pool.query(
    `
    SELECT
      role_id,
      role_name
    FROM roles
    WHERE role_name IN ('Student', 'Employer')
    ORDER BY role_name
    `,
  );

  return roles;
};
