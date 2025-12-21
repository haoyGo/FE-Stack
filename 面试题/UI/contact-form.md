# Contact Form 联系表单实现

> 实现一个完整的联系表单，包含表单验证、错误提示、提交处理等功能

## 一、效果预览

```
┌─────────────────────────────────────┐
│  Contact Us                         │
│                                     │
│  Name *                             │
│  ┌───────────────────────────────┐ │
│  │ John Doe                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Email *                            │
│  ┌───────────────────────────────┐ │
│  │ john@example.com              │ │
│  └───────────────────────────────┘ │
│  ✓ Valid email address             │
│                                     │
│  Message *                          │
│  ┌───────────────────────────────┐ │
│  │ Hello, I'd like to...         │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌──────────┐                      │
│  │  Submit  │                      │
│  └──────────┘                      │
└─────────────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 简单版本

```jsx
import React, { useState } from 'react';
import './ContactForm.css';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // 验证消息
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      
      // 重置表单
      setFormData({
        name: '',
        email: '',
        message: ''
      });

      // 3秒后隐藏成功提示
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us</h2>
      
      {submitSuccess && (
        <div className="alert alert-success">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="contact-form" noValidate>
        <div className="form-group">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Enter your name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <span className="error-message">{errors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            placeholder="Enter your email"
            disabled={isSubmitting}
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="message">
            Message <span className="required">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={errors.message ? 'error' : ''}
            placeholder="Enter your message"
            rows="5"
            disabled={isSubmitting}
          />
          {errors.message && (
            <span className="error-message">{errors.message}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
```

### 2.2 CSS 样式

```css
/* ContactForm.css */
.contact-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.contact-form-container h2 {
  margin: 0 0 24px 0;
  font-size: 28px;
  color: #333;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #dc3545;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group input.error,
.form-group textarea.error {
  border-color: #dc3545;
}

.form-group input.error:focus,
.form-group textarea.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  font-size: 13px;
  color: #dc3545;
  margin-top: 4px;
}

.submit-button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .contact-form-container {
    padding: 20px;
  }

  .contact-form-container h2 {
    font-size: 24px;
  }
}
```

## 三、进阶实现（自定义 Hook）

### 3.1 useForm Hook

```jsx
import { useState, useCallback } from 'react';

function useForm(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证单个字段
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  // 验证所有字段
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // 处理输入变化
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // 如果字段已被触摸，实时验证
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  // 处理失焦
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [validateField]);

  // 处理提交
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();

      // 标记所有字段为已触摸
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // 验证表单
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateForm]);

  // 重置表单
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setErrors
  };
}

export default useForm;
```

### 3.2 验证规则

```jsx
// validators.js
export const required = (fieldName) => (value) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

export const email = (value) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email address';
  }
  return '';
};

export const minLength = (min) => (value) => {
  if (value && value.trim().length < min) {
    return `Must be at least ${min} characters`;
  }
  return '';
};

export const maxLength = (max) => (value) => {
  if (value && value.length > max) {
    return `Must be no more than ${max} characters`;
  }
  return '';
};

export const pattern = (regex, message) => (value) => {
  if (value && !regex.test(value)) {
    return message;
  }
  return '';
};

export const phone = (value) => {
  if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
    return 'Invalid phone number';
  }
  return '';
};
```

### 3.3 使用 useForm Hook

```jsx
import React, { useState } from 'react';
import useForm from './useForm';
import { required, email, minLength } from './validators';
import './ContactForm.css';

function ContactFormWithHook() {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validationRules = {
    name: [required('Name')],
    email: [required('Email'), email],
    message: [required('Message'), minLength(10)]
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setErrors
  } = useForm(
    {
      name: '',
      email: '',
      message: ''
    },
    validationRules
  );

  const onSubmit = async (formData) => {
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form submitted:', formData);
      setSubmitSuccess(true);
      resetForm();

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us</h2>
      
      {submitSuccess && (
        <div className="alert alert-success">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="contact-form" noValidate>
        <div className="form-group">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.name && errors.name ? 'error' : ''}
            placeholder="Enter your name"
            disabled={isSubmitting}
          />
          {touched.name && errors.name && (
            <span className="error-message">{errors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.email && errors.email ? 'error' : ''}
            placeholder="Enter your email"
            disabled={isSubmitting}
          />
          {touched.email && errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="message">
            Message <span className="required">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={values.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={touched.message && errors.message ? 'error' : ''}
            placeholder="Enter your message"
            rows="5"
            disabled={isSubmitting}
          />
          {touched.message && errors.message && (
            <span className="error-message">{errors.message}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

export default ContactFormWithHook;
```

## 四、完整功能版本

### 4.1 带实时验证和成功图标

```jsx
import React, { useState } from 'react';
import useForm from './useForm';
import { required, email, minLength, phone } from './validators';
import './ContactForm.css';

function ContactFormComplete() {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validationRules = {
    name: [required('Name'), minLength(2)],
    email: [required('Email'), email],
    phone: [phone],
    subject: [required('Subject')],
    message: [required('Message'), minLength(10)]
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setErrors
  } = useForm(
    {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    },
    validationRules
  );

  const onSubmit = async (formData) => {
    try {
      // 实际 API 调用
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      setSubmitSuccess(true);
      resetForm();

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    }
  };

  const isFieldValid = (fieldName) => {
    return touched[fieldName] && !errors[fieldName] && values[fieldName];
  };

  return (
    <div className="contact-form-container">
      <h2>Get in Touch</h2>
      <p className="subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      
      {submitSuccess && (
        <div className="alert alert-success">
          <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="contact-form" noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.name 
                    ? errors.name 
                      ? 'error' 
                      : 'valid'
                    : ''
                }
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {isFieldValid('name') && (
                <span className="valid-icon">✓</span>
              )}
            </div>
            {touched.name && errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.email 
                    ? errors.email 
                      ? 'error' 
                      : 'valid'
                    : ''
                }
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
              {isFieldValid('email') && (
                <span className="valid-icon">✓</span>
              )}
            </div>
            {touched.email && errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">
              Phone (Optional)
            </label>
            <div className="input-wrapper">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.phone 
                    ? errors.phone 
                      ? 'error' 
                      : values.phone ? 'valid' : ''
                    : ''
                }
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
              {isFieldValid('phone') && (
                <span className="valid-icon">✓</span>
              )}
            </div>
            {touched.phone && errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="subject">
              Subject <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <select
                id="subject"
                name="subject"
                value={values.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.subject 
                    ? errors.subject 
                      ? 'error' 
                      : 'valid'
                    : ''
                }
                disabled={isSubmitting}
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="sales">Sales</option>
                <option value="feedback">Feedback</option>
              </select>
              {isFieldValid('subject') && (
                <span className="valid-icon">✓</span>
              )}
            </div>
            {touched.subject && errors.subject && (
              <span className="error-message">{errors.subject}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">
            Message <span className="required">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={values.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={
              touched.message 
                ? errors.message 
                  ? 'error' 
                  : 'valid'
                : ''
            }
            placeholder="Tell us more about your inquiry..."
            rows="6"
            disabled={isSubmitting}
          />
          <div className="message-meta">
            <span className="char-count">
              {values.message.length} / 500
            </span>
          </div>
          {touched.message && errors.message && (
            <span className="error-message">{errors.message}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </form>
    </div>
  );
}

export default ContactFormComplete;
```

### 4.2 完整 CSS

```css
/* ContactForm.css - Complete Version */
.contact-form-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.contact-form-container h2 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #1a1a1a;
}

.subtitle {
  margin: 0 0 32px 0;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 6px;
  margin-bottom: 24px;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #dc3545;
}

.input-wrapper {
  position: relative;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s;
  font-family: inherit;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group input.valid,
.form-group select.valid,
.form-group textarea.valid {
  border-color: #4CAF50;
  padding-right: 40px;
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #dc3545;
}

.form-group input.error:focus,
.form-group select.error:focus,
.form-group textarea.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.valid-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #4CAF50;
  font-weight: bold;
  font-size: 18px;
}

.error-message {
  font-size: 13px;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-message::before {
  content: '⚠';
  font-size: 14px;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.submit-button {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .contact-form-container {
    padding: 24px;
  }

  .contact-form-container h2 {
    font-size: 26px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
```

## 五、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }

    .contact-form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin-bottom: 24px;
      font-size: 28px;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .required {
      color: #dc3545;
    }

    input,
    textarea {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: all 0.2s;
      font-family: inherit;
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }

    input.error,
    textarea.error {
      border-color: #dc3545;
    }

    .error-message {
      display: none;
      font-size: 13px;
      color: #dc3545;
      margin-top: 4px;
    }

    .error-message.show {
      display: block;
    }

    .success-message {
      display: none;
      padding: 12px 16px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .success-message.show {
      display: block;
    }

    button {
      width: 100%;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      background: #4CAF50;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover {
      background: #45a049;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="contact-form-container">
    <h2>Contact Us</h2>
    
    <div id="successMessage" class="success-message">
      Thank you! Your message has been sent successfully.
    </div>

    <form id="contactForm" novalidate>
      <div class="form-group">
        <label for="name">
          Name <span class="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Enter your name"
        />
        <div class="error-message" data-error="name"></div>
      </div>

      <div class="form-group">
        <label for="email">
          Email <span class="required">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
        />
        <div class="error-message" data-error="email"></div>
      </div>

      <div class="form-group">
        <label for="message">
          Message <span class="required">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Enter your message"
          rows="5"
        ></textarea>
        <div class="error-message" data-error="message"></div>
      </div>

      <button type="submit" id="submitBtn">Send Message</button>
    </form>
  </div>

  <script>
    class ContactForm {
      constructor(formId) {
        this.form = document.getElementById(formId);
        this.submitBtn = this.form.querySelector('#submitBtn');
        this.successMessage = document.getElementById('successMessage');
        
        this.fields = {
          name: this.form.querySelector('#name'),
          email: this.form.querySelector('#email'),
          message: this.form.querySelector('#message')
        };

        this.init();
      }

      init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 实时验证
        Object.keys(this.fields).forEach(fieldName => {
          this.fields[fieldName].addEventListener('blur', () => {
            this.validateField(fieldName);
          });

          this.fields[fieldName].addEventListener('input', () => {
            this.clearError(fieldName);
          });
        });
      }

      validateField(fieldName) {
        const field = this.fields[fieldName];
        const value = field.value.trim();
        let error = '';

        switch (fieldName) {
          case 'name':
            if (!value) {
              error = 'Name is required';
            }
            break;

          case 'email':
            if (!value) {
              error = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              error = 'Invalid email address';
            }
            break;

          case 'message':
            if (!value) {
              error = 'Message is required';
            } else if (value.length < 10) {
              error = 'Message must be at least 10 characters';
            }
            break;
        }

        if (error) {
          this.showError(fieldName, error);
          return false;
        }

        return true;
      }

      showError(fieldName, message) {
        const field = this.fields[fieldName];
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
      }

      clearError(fieldName) {
        const field = this.fields[fieldName];
        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);
        
        field.classList.remove('error');
        errorElement.classList.remove('show');
      }

      validateForm() {
        let isValid = true;

        Object.keys(this.fields).forEach(fieldName => {
          if (!this.validateField(fieldName)) {
            isValid = false;
          }
        });

        return isValid;
      }

      async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
          return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Sending...';

        try {
          // 模拟 API 调用
          await new Promise(resolve => setTimeout(resolve, 1500));

          const formData = {
            name: this.fields.name.value,
            email: this.fields.email.value,
            message: this.fields.message.value
          };

          console.log('Form submitted:', formData);

          // 显示成功消息
          this.successMessage.classList.add('show');
          this.form.reset();

          // 3秒后隐藏成功消息
          setTimeout(() => {
            this.successMessage.classList.remove('show');
          }, 3000);

        } catch (error) {
          alert('Failed to submit form. Please try again.');
        } finally {
          this.submitBtn.disabled = false;
          this.submitBtn.textContent = 'Send Message';
        }
      }
    }

    // 初始化表单
    new ContactForm('contactForm');
  </script>
</body>
</html>
```

## 六、关键知识点

### 6.1 表单验证策略

```jsx
// 1. 提交时验证（最基础）
const handleSubmit = (e) => {
  e.preventDefault();
  if (validateForm()) {
    submitForm();
  }
};

// 2. 失焦时验证（更友好）
const handleBlur = (e) => {
  validateField(e.target.name, e.target.value);
};

// 3. 实时验证（已触摸字段）
const handleChange = (e) => {
  if (touched[e.target.name]) {
    validateField(e.target.name, e.target.value);
  }
};

// 4. 防抖验证（性能优化）
const debouncedValidate = debounce((name, value) => {
  validateField(name, value);
}, 300);
```

### 6.2 无障碍性

```jsx
<form noValidate> {/* 禁用浏览器默认验证 */}
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert">
    {errors.email}
  </span>
</form>
```

### 6.3 常见验证规则

```javascript
// 邮箱验证
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 手机号验证（美国）
const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

// URL 验证
const urlRegex = /^https?:\/\/.+/;

// 密码强度（至少8位，包含大小写字母和数字）
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
```

## 七、面试要点

### 7.1 常见问题

**Q1: 如何防止表单重复提交？**

```jsx
// 方案1: 禁用按钮
const [isSubmitting, setIsSubmitting] = useState(false);
<button disabled={isSubmitting}>Submit</button>

// 方案2: 防抖
const handleSubmit = debounce(async (e) => {
  // 提交逻辑
}, 1000, { leading: true, trailing: false });

// 方案3: 请求 ID
let requestId = 0;
const handleSubmit = async () => {
  const currentRequestId = ++requestId;
  const result = await submitForm();
  if (currentRequestId !== requestId) return; // 忽略旧请求
  // 处理结果
};
```

**Q2: 如何处理文件上传？**

```jsx
const [file, setFile] = useState(null);

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(selectedFile.type)) {
    setErrors({ file: 'Invalid file type' });
    return;
  }

  // 验证文件大小（5MB）
  if (selectedFile.size > 5 * 1024 * 1024) {
    setErrors({ file: 'File too large (max 5MB)' });
    return;
  }

  setFile(selectedFile);
};

const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', values.name);
  
  await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
};
```

**Q3: 如何实现多步骤表单？**

```jsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div>
      {step === 1 && <Step1 data={formData} onChange={setFormData} />}
      {step === 2 && <Step2 data={formData} onChange={setFormData} />}
      {step === 3 && <Step3 data={formData} onSubmit={handleSubmit} />}
      
      <div className="buttons">
        {step > 1 && <button onClick={prevStep}>Back</button>}
        {step < 3 && <button onClick={nextStep}>Next</button>}
        {step === 3 && <button onClick={handleSubmit}>Submit</button>}
      </div>
    </div>
  );
}
```

**Q4: 如何优化表单性能？**

```jsx
// 1. 使用 useCallback 缓存函数
const handleChange = useCallback((e) => {
  // ...
}, [dependencies]);

// 2. 拆分组件，使用 React.memo
const FormField = React.memo(({ name, value, onChange, error }) => {
  // ...
});

// 3. 延迟验证
const debouncedValidate = useMemo(
  () => debounce(validateField, 300),
  []
);

// 4. 虚拟化长列表（如国家选择器）
import { FixedSizeList } from 'react-window';
```

## 八、集成第三方库

### 8.1 React Hook Form

```jsx
import { useForm } from 'react-hook-form';

function ContactFormRHF() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    await submitToAPI(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { 
          required: 'Name is required',
          minLength: { value: 2, message: 'Too short' }
        })}
      />
      {errors.name && <span>{errors.name.message}</span>}

      <input
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email'
          }
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <button disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```

### 8.2 Formik

```jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  message: Yup.string().min(10, 'Too short').required('Required')
});

function ContactFormFormik() {
  return (
    <Formik
      initialValues={{ name: '', email: '', message: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        await submitToAPI(values);
        setSubmitting(false);
        resetForm();
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field name="name" placeholder="Name" />
          <ErrorMessage name="name" component="div" />

          <Field name="email" type="email" placeholder="Email" />
          <ErrorMessage name="email" component="div" />

          <Field name="message" as="textarea" placeholder="Message" />
          <ErrorMessage name="message" component="div" />

          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

---

**总结**：
- ✅ 完整的表单验证（实时、失焦、提交）
- ✅ 友好的错误提示
- ✅ 加载状态和成功提示
- ✅ 无障碍性支持
- ✅ 响应式设计
- ✅ 防止重复提交
- ✅ 自定义验证规则
- ✅ 支持第三方库集成