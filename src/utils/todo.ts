// Implement zod for secuirity


// try {
//   // Authentication check
//   if (!req.user) {
//     return res
//       .status(401)
//       .json({ error: "Unauthorized: No user session found" });
//   }

//   // Validation - Fixed schema name + proper Zod usage
//   const validationResult = createCourseSchema.safeParse(req.body);
  
//   if (!validationResult.success) {
//     return res.status(400).json({
//       error: "Invalid request data",
//       issues: validationResult.error.issues, // helpful for frontend
//     });
//   }

//   const { code, title, level, semester, description } = validationResult.data;
//   const lecturerId = req.user.id;

//   const newCourse = await prisma.course.create({
//     data: {
//       code,
//       title,
//       level: Number(level),           // More robust than parseInt
//       semester: semester ? Number(semester) : 1,
//       description,
//       lecturerId,
//     },
//   });

//   res.status(201).json({
//     message: "Course created successfully",
//     data: newCourse,
//   });
// } catch (error) {
//   next(error);
// }