<?php
// 1. Настройки
// !!! ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ ЭТУ СТРОКУ НА info@myugc.studio !!!
$receiving_email_address = 'info@myugc.studio'; 

// 2. Проверка метода отправки (обеспечивает, что только POST-запросы будут обработаны)
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    header("Location: index.html");
    exit;
}

// 3. Сбор и очистка данных
// Защита от XSS-атак и очистка
$name = filter_var(trim($_POST["name"]), FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
$message = filter_var(trim($_POST["message"]), FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$subject = "Новый запрос с MyUGC Studio от: " . $name;

// 4. Валидация
if (empty($name) || empty($email) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // В случае ошибки, перенаправляем обратно
    header("Location: index.html?status=error_validation");
    exit;
}

// 5. Формирование тела письма
$email_content = "Имя: $name\n";
$email_content .= "Email: $email\n\n";
$email_content .= "Сообщение:\n$message\n";

// 6. Формирование заголовков
// Это важно, чтобы письмо не попало в спам
$email_headers = "From: Запрос с MyUGC Studio <noreply@myugc.studio>\r\n";
$email_headers .= "Reply-To: $email\r\n";
$email_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// 7. Отправка письма
if (mail($receiving_email_address, $subject, $email_content, $email_headers)) {
    // Успех: перенаправляем на главную, можете добавить сообщение 'Спасибо!'
    header("Location: index.html?status=success");
} else {
    // Ошибка отправки: перенаправляем обратно
    header("Location: index.html?status=error_send");
}
exit;
?>